-- Application roles are assigned only by trusted server-side provisioning.
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
revoke insert, update on table public.profiles from anon, authenticated;
