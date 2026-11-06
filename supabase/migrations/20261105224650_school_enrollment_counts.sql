-- Respeta las políticas de acceso de profiles del usuario que ejecuta la consulta.
create or replace function public.school_enrollment_counts(school_ids uuid[])
returns table (school_id uuid, enrolled_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.school_id, count(*)
  from public.profiles p
  where p.school_id = any(school_ids)
  group by p.school_id;
$$;

revoke all on function public.school_enrollment_counts(uuid[]) from public, anon;
grant execute on function public.school_enrollment_counts(uuid[]) to authenticated;
