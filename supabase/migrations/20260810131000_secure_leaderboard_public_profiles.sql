create table if not exists public.public_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  school text not null default '',
  course text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists public_profiles_is_active_idx on public.public_profiles(is_active);
create index if not exists public_profiles_school_idx on public.public_profiles(school);

create or replace function app_private.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.public_profiles (user_id, name, school, course, is_active, updated_at)
  values (new.id, new.name, new.school, new.course, new.is_active, now())
  on conflict (user_id) do update
  set
    name = excluded.name,
    school = excluded.school,
    course = excluded.course,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function app_private.sync_public_profile() from public;

drop trigger if exists sync_public_profile on public.profiles;
create trigger sync_public_profile
after insert or update of name, school, course, is_active
on public.profiles
for each row
execute function app_private.sync_public_profile();

insert into public.public_profiles (user_id, name, school, course, is_active)
select id, name, school, course, is_active
from public.profiles
on conflict (user_id) do update
set
  name = excluded.name,
  school = excluded.school,
  course = excluded.course,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.public_profiles enable row level security;

grant select on public.public_profiles to authenticated;

drop policy if exists "Authenticated users can view active public profiles" on public.public_profiles;
create policy "Authenticated users can view active public profiles"
on public.public_profiles
for select
to authenticated
using (is_active = true);

drop policy if exists "Admins can view all public profiles" on public.public_profiles;
create policy "Admins can view all public profiles"
on public.public_profiles
for select
to authenticated
using (app_private.is_admin());

create or replace view public.leaderboard
with (security_invoker = true)
as
with best_stage_scores as (
  select
    user_id,
    stage_id,
    max(score) as score
  from public.game_results
  group by user_id, stage_id
),
last_played as (
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
    coalesce(sum(best_stage_scores.score), 0)::integer as score,
    count(best_stage_scores.stage_id)::integer as completed_stages,
    last_played.last_played_at
  from public.public_profiles
  left join best_stage_scores on best_stage_scores.user_id = public_profiles.user_id
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
