-- Auth JWTs can outlive account deletion/logout. Require a live server-side session
-- for every operation involving personal profiles, public ranking profiles or results.
create or replace function app_private.has_live_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions as sessions
    where sessions.user_id = (select auth.uid())
      and sessions.id::text = (select auth.jwt() ->> 'session_id')
      and (sessions.not_after is null or sessions.not_after > now())
  );
$$;

revoke all on function app_private.has_live_session() from public, anon;
grant execute on function app_private.has_live_session() to authenticated;

create policy "Personal data requires a live session"
on public.profiles as restrictive
for all to authenticated
using ((select app_private.has_live_session()))
with check ((select app_private.has_live_session()));

create policy "Ranking profiles require a live session"
on public.public_profiles as restrictive
for all to authenticated
using ((select app_private.has_live_session()))
with check ((select app_private.has_live_session()));

create policy "Game results require a live session"
on public.game_results as restrictive
for all to authenticated
using ((select app_private.has_live_session()))
with check ((select app_private.has_live_session()));
