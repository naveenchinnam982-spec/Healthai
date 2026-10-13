-- Keep the automatic RLS-enabling event-trigger function outside exposed API schemas.
alter function public.rls_auto_enable() set schema private;
revoke all on function private.rls_auto_enable() from public, anon, authenticated;
