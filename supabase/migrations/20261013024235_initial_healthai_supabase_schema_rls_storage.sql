-- Healthai initial Supabase schema (reconstructed from the provisioned project).
-- The follow-up alignment migration hardens function exposure and reconciles legacy columns.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'patient',
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  date_of_birth text,
  gender text,
  blood_group text,
  phone text,
  email text,
  uhid text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  password_hash text,
  full_name text not null,
  credentials text default 'MD',
  registration_number text unique,
  specialty text default 'General Medicine',
  facility_name text default 'Continuum Health Centre',
  facility_id text,
  avatar_initials text default 'DR',
  verified boolean not null default false,
  role text not null default 'doctor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_date text not null,
  hospital_name text,
  doctor_name text,
  visit_type text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_id text references public.visits(id) on delete set null,
  document_type text not null,
  file_name text,
  file_url text,
  storage_path text,
  uploaded_at timestamptz not null default now(),
  processing_status text not null default 'PENDING',
  extracted_text text,
  extracted_data text,
  confidence_score double precision,
  review_status text default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_id text references public.visits(id) on delete set null,
  source_document_id text references public.documents(id) on delete set null,
  name text not null,
  dosage text,
  frequency text,
  route text,
  status text not null default 'CURRENT',
  start_date text,
  end_date text,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_id text references public.visits(id) on delete set null,
  source_document_id text references public.documents(id) on delete set null,
  test_name text not null,
  value text,
  unit text,
  reference_range text,
  test_date text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_decisions (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_id text references public.visits(id) on delete set null,
  decision text not null,
  reason text,
  confidence double precision,
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.change_events (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  previous_visit_id text references public.visits(id) on delete set null,
  current_visit_id text references public.visits(id) on delete set null,
  change_type text not null,
  field_name text,
  previous_value text,
  current_value text,
  reason_status text not null default 'UNKNOWN',
  evidence_status text not null default 'UNKNOWN',
  review_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.evidences (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  related_change_id text references public.change_events(id) on delete cascade,
  document_id text references public.documents(id) on delete set null,
  evidence_type text,
  description text,
  confidence double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.doctor_accesses (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  code_hash text unique,
  doctor_id text,
  doctor_name text,
  doctor_email text,
  scope jsonb not null default '[]'::jsonb,
  purpose text not null default 'DEMO_PURPOSE_ONLY',
  status text not null default 'PENDING',
  attempts_used integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  approved_at timestamptz,
  revoked_at timestamptz,
  revoked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_queue_items (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  doctor_id text,
  access_id text references public.doctor_accesses(id) on delete set null,
  title text not null,
  document_id text references public.documents(id) on delete set null,
  document_name text,
  change_event_id text references public.change_events(id) on delete set null,
  item_type text not null default 'PRESCRIPTION_HANDWRITING',
  field_name text,
  candidate_value text,
  uncertainty_reason text,
  description text,
  patient_note text,
  doctor_response text,
  resolution text,
  resolution_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  status text not null default 'PENDING',
  priority text not null default 'ROUTINE',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.decision_memories (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  visit_id text references public.visits(id) on delete set null,
  title text,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  finding text,
  decision text not null default '',
  reason text,
  evidence text,
  follow_up text,
  verification_status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  title text not null default 'Health Conversation',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  patient_id text not null references public.patients(id) on delete cascade,
  role text not null,
  content text not null,
  intent text,
  language text not null default 'en',
  citations_json text,
  safety_status text not null default 'SAFE',
  uncertainty_notes text,
  provider text default 'grounded_records_engine',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  actor_id text not null,
  actor_name text not null,
  actor_role text not null default 'doctor',
  action text not null,
  patient_id text,
  patient_name text,
  resource_type text not null default 'shared_access_grant',
  resource_id text,
  purpose text default 'DEMO_PURPOSE_ONLY',
  authorization_ref text,
  outcome text not null default 'success',
  detail text not null,
  created_at timestamptz not null default now()
);

create index if not exists ix_patients_owner_id on public.patients(owner_id);
create index if not exists ix_doctors_user_id on public.doctors(user_id);
create index if not exists ix_visits_patient_id on public.visits(patient_id);
create index if not exists ix_documents_patient_id on public.documents(patient_id);
create index if not exists ix_medications_patient_id on public.medications(patient_id);
create index if not exists ix_lab_results_patient_id on public.lab_results(patient_id);
create index if not exists ix_change_events_patient_id on public.change_events(patient_id);
create index if not exists ix_doctor_accesses_patient_id on public.doctor_accesses(patient_id);
create index if not exists ix_doctor_accesses_code_hash on public.doctor_accesses(code_hash);
create index if not exists ix_review_queue_patient_id on public.review_queue_items(patient_id);
create index if not exists ix_decision_memories_patient_id on public.decision_memories(patient_id);
create index if not exists ix_conversations_patient_id on public.conversations(patient_id);
create index if not exists ix_messages_patient_id on public.messages(patient_id);
create index if not exists ix_audit_logs_patient_id on public.audit_logs(patient_id);

create or replace function public.can_access_patient(target_patient_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
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

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.visits enable row level security;
alter table public.documents enable row level security;
alter table public.medications enable row level security;
alter table public.lab_results enable row level security;
alter table public.clinical_decisions enable row level security;
alter table public.change_events enable row level security;
alter table public.evidences enable row level security;
alter table public.doctor_accesses enable row level security;
alter table public.review_queue_items enable row level security;
alter table public.decision_memories enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists patients_select_authorized on public.patients;
create policy patients_select_authorized on public.patients for select to authenticated using (owner_id = auth.uid() or public.can_access_patient(id::text));
drop policy if exists patients_insert_owner on public.patients;
create policy patients_insert_owner on public.patients for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists patients_update_owner on public.patients;
create policy patients_update_owner on public.patients for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists doctors_select_self on public.doctors;
create policy doctors_select_self on public.doctors for select to authenticated using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['visits','documents','medications','lab_results','clinical_decisions','change_events','evidences','doctor_accesses','review_queue_items','decision_memories','conversations'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_authorized', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_access_patient(patient_id::text))', t || '_select_authorized', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_owner', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = auth.uid()))', t || '_insert_owner', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_owner', t);
    execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = auth.uid())) with check (exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = auth.uid()))', t || '_update_owner', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_owner', t);
    execute format('create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = auth.uid()))', t || '_delete_owner', t);
  end loop;
end $$;

drop policy if exists messages_select_authorized on public.messages;
create policy messages_select_authorized on public.messages for select to authenticated using (public.can_access_patient(patient_id::text));
drop policy if exists messages_insert_owner on public.messages;
create policy messages_insert_owner on public.messages for insert to authenticated with check (exists (select 1 from public.patients p where p.id::text = patient_id::text and p.owner_id = auth.uid()));

drop policy if exists audit_logs_select_authorized on public.audit_logs;
create policy audit_logs_select_authorized on public.audit_logs for select to authenticated using (public.can_access_patient(patient_id::text));

insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false)
on conflict (id) do update set public = false;

drop policy if exists medical_documents_read_authorized on storage.objects;
create policy medical_documents_read_authorized on storage.objects for select to authenticated using (
  bucket_id = 'medical-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.can_access_patient((storage.foldername(name))[2])
  )
);
drop policy if exists medical_documents_upload_owner on storage.objects;
create policy medical_documents_upload_owner on storage.objects for insert to authenticated with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.patients p
    where p.id::text = (storage.foldername(name))[2]
      and p.owner_id = auth.uid()
  )
);
drop policy if exists medical_documents_update_owner on storage.objects;
create policy medical_documents_update_owner on storage.objects for update to authenticated using (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists medical_documents_delete_owner on storage.objects;
create policy medical_documents_delete_owner on storage.objects for delete to authenticated using (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
