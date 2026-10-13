-- Align the already-provisioned Healthai project with the patient API ORM.
-- This migration is additive for legacy data; it does not drop patient records.

alter table public.patients add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.doctors add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.doctors add column if not exists password_hash text;
alter table public.doctors add column if not exists specialty text default 'General Medicine';
alter table public.doctors add column if not exists facility_id text;
alter table public.doctors add column if not exists avatar_initials text default 'DR';
alter table public.doctors add column if not exists verified boolean not null default false;
alter table public.doctors add column if not exists role text not null default 'doctor';

alter table public.documents add column if not exists storage_path text;
alter table public.documents alter column extracted_data type text using extracted_data::text;
alter table public.evidences add column if not exists evidence_type text;

alter table public.doctor_accesses add column if not exists doctor_name text;
alter table public.doctor_accesses add column if not exists doctor_email text;
alter table public.doctor_accesses add column if not exists approved_at timestamptz;
alter table public.doctor_accesses add column if not exists revoked_by text;
create unique index if not exists ux_doctor_accesses_code_hash on public.doctor_accesses(code_hash);

alter table public.review_queue_items add column if not exists doctor_id text;
alter table public.review_queue_items add column if not exists access_id text;
alter table public.review_queue_items add column if not exists item_type text not null default 'PRESCRIPTION_HANDWRITING';
alter table public.review_queue_items add column if not exists field_name text;
alter table public.review_queue_items add column if not exists candidate_value text;
alter table public.review_queue_items add column if not exists uncertainty_reason text;
alter table public.review_queue_items add column if not exists patient_note text;
alter table public.review_queue_items add column if not exists doctor_response text;
alter table public.review_queue_items add column if not exists priority text not null default 'ROUTINE';
alter table public.review_queue_items add column if not exists resolved_at timestamptz;

alter table public.decision_memories add column if not exists finding text;
alter table public.decision_memories add column if not exists decision text not null default '';
alter table public.decision_memories add column if not exists reason text;
alter table public.decision_memories add column if not exists evidence text;
alter table public.decision_memories add column if not exists follow_up text;
alter table public.decision_memories add column if not exists verification_status text not null default 'PENDING';

alter table public.conversations add column if not exists language text not null default 'en';
alter table public.messages add column if not exists patient_id text;
alter table public.messages add column if not exists intent text;
alter table public.messages add column if not exists language text not null default 'en';
alter table public.messages add column if not exists citations_json text;
alter table public.messages add column if not exists safety_status text not null default 'SAFE';
alter table public.messages add column if not exists uncertainty_notes text;
alter table public.messages add column if not exists provider text default 'grounded_records_engine';

alter table public.audit_logs add column if not exists actor_name text;
alter table public.audit_logs add column if not exists patient_name text;
alter table public.audit_logs add column if not exists authorization_ref text;
alter table public.audit_logs add column if not exists resource_type text not null default 'shared_access_grant';
alter table public.audit_logs add column if not exists resource_id text;
alter table public.audit_logs add column if not exists purpose text default 'DEMO_PURPOSE_ONLY';
alter table public.audit_logs add column if not exists outcome text not null default 'success';
alter table public.audit_logs add column if not exists detail text not null default '';
alter table public.audit_logs add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_patient_id_fkey' and conrelid = 'public.messages'::regclass) then
    alter table public.messages add constraint messages_patient_id_fkey foreign key (patient_id) references public.patients(id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'review_queue_items_access_id_fkey' and conrelid = 'public.review_queue_items'::regclass) then
    alter table public.review_queue_items add constraint review_queue_items_access_id_fkey foreign key (access_id) references public.doctor_accesses(id) on delete set null not valid;
  end if;
end $$;

create index if not exists ix_patients_owner_id on public.patients(owner_id);
create index if not exists ix_doctors_user_id on public.doctors(user_id);
create index if not exists ix_messages_patient_id on public.messages(patient_id);
create index if not exists ix_review_queue_access_id on public.review_queue_items(access_id);

-- SECURITY DEFINER helpers must not remain callable from the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.can_access_patient(target_patient_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.patients p
      where p.id::text = target_patient_id and p.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.doctor_accesses da
      join public.doctors d on d.id::text = da.doctor_id::text
      where da.patient_id::text = target_patient_id
        and d.user_id = auth.uid()
        and d.is_active = true
        and da.status = 'ACTIVE'
        and da.revoked_at is null
        and da.expires_at > now()
    )
  );
$$;
revoke all on function private.can_access_patient(text) from public, anon;
grant execute on function private.can_access_patient(text) to authenticated;

do $$
declare p record; sql text; q text; wc text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%can_access_patient%'
        or coalesce(with_check, '') like '%can_access_patient%'
        or coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%')
  loop
    q := p.qual;
    wc := p.with_check;
    if q is not null then
      q := replace(q, 'can_access_patient', 'private.can_access_patient');
      q := replace(q, 'auth.uid()', '(select auth.uid())');
    end if;
    if wc is not null then
      wc := replace(wc, 'can_access_patient', 'private.can_access_patient');
      wc := replace(wc, 'auth.uid()', '(select auth.uid())');
    end if;
    sql := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then sql := sql || format(' using (%s)', q); end if;
    if wc is not null then sql := sql || format(' with check (%s)', wc); end if;
    execute sql;
  end loop;
end $$;

-- A message's patient_id is the authorization boundary; do not rely only on conversation IDs.
drop policy if exists messages_select_authorized on public.messages;
create policy messages_select_authorized on public.messages
  for select to authenticated using (private.can_access_patient(patient_id::text));
drop policy if exists messages_insert_owner on public.messages;
create policy messages_insert_owner on public.messages
  for insert to authenticated with check (
    exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = (select auth.uid()))
  );

-- The object path is <owner-uuid>/<patient-id>/<document-id>_<filename>.
drop policy if exists medical_documents_read_authorized on storage.objects;
create policy medical_documents_read_authorized on storage.objects
  for select to authenticated using (
    bucket_id = 'medical-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.can_access_patient((storage.foldername(storage.objects.name))[2])
    )
  );
drop policy if exists medical_documents_upload_owner on storage.objects;
create policy medical_documents_upload_owner on storage.objects
  for insert to authenticated with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.patients p
      where p.id::text = (storage.foldername(storage.objects.name))[2]
        and p.owner_id = (select auth.uid())
    )
  );
drop policy if exists medical_documents_update_owner on storage.objects;
create policy medical_documents_update_owner on storage.objects
  for update to authenticated using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists medical_documents_delete_owner on storage.objects;
create policy medical_documents_delete_owner on storage.objects
  for delete to authenticated using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false)
on conflict (id) do update set public = false;

drop function if exists public.can_access_patient(text);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
