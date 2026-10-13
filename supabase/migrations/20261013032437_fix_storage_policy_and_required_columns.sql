-- Qualify storage.objects.name so the patients.name column cannot shadow it in the subquery.
drop policy if exists medical_documents_upload_owner on storage.objects;
create policy medical_documents_upload_owner on storage.objects
for insert to authenticated with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.patients p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and p.owner_id = (select auth.uid())
  )
);
alter table public.messages alter column patient_id set not null;
alter table public.doctor_accesses alter column code_hash set not null;
