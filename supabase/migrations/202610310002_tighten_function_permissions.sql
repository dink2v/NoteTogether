alter function public.set_updated_at() set search_path = public, pg_temp;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
