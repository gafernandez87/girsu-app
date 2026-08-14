with ranked_results as (
  select
    id,
    row_number() over (
      partition by user_id, stage_id
      order by created_at asc, completed_at asc, id asc
    ) as row_position
  from public.game_results
)
delete from public.game_results
using ranked_results
where public.game_results.id = ranked_results.id
  and ranked_results.row_position > 1;

drop index if exists public.game_results_user_stage_score_idx;

create unique index if not exists game_results_user_stage_unique_idx
on public.game_results(user_id, stage_id);

drop policy if exists "Admins can insert game results" on public.game_results;
create policy "Admins can insert game results"
on public.game_results
for insert
to authenticated
with check (app_private.is_admin());

create or replace view public.leaderboard
with (security_invoker = true)
as
with last_played as (
  select
    user_id,
    max(completed_at) as last_played_at
  from public.game_results
  group by user_id
),
totals as (
  select
    public_profiles.user_id,
    public_profiles.name,
    public_profiles.school,
    public_profiles.course,
    coalesce(sum(game_results.score), 0)::integer as score,
    count(game_results.stage_id)::integer as completed_stages,
    last_played.last_played_at
  from public.public_profiles
  left join public.game_results on game_results.user_id = public_profiles.user_id
  left join last_played on last_played.user_id = public_profiles.user_id
  where public_profiles.is_active = true
  group by
    public_profiles.user_id,
    public_profiles.name,
    public_profiles.school,
    public_profiles.course,
    last_played.last_played_at
)
select
  row_number() over (
    order by score desc, completed_stages desc, last_played_at asc nulls last, name asc
  )::integer as position,
  user_id,
  name,
  school,
  course,
  score,
  completed_stages,
  last_played_at
from totals;

grant select on public.leaderboard to authenticated;
