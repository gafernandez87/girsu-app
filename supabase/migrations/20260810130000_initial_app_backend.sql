create extension if not exists pgcrypto;

create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'player' check (role in ('player', 'admin')),
  school text not null default '',
  course text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_school_idx on public.profiles(school);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function app_private.set_updated_at();

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

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stage_id text not null check (
    stage_id in (
      'separacion-origen',
      'valorizacion-industrial',
      'compostaje-domiciliario',
      'relleno-sanitario'
    )
  ),
  score integer not null check (score between 0 and 1000),
  raw_score integer,
  score_breakdown jsonb not null default '[]'::jsonb check (jsonb_typeof(score_breakdown) = 'array'),
  correct integer not null default 0 check (correct >= 0),
  mistakes integer not null default 0 check (mistakes >= 0),
  remaining_seconds integer not null default 0 check (remaining_seconds >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists game_results_user_id_idx on public.game_results(user_id);
create index if not exists game_results_stage_id_idx on public.game_results(stage_id);
create index if not exists game_results_completed_at_idx on public.game_results(completed_at desc);
create index if not exists game_results_user_stage_score_idx
  on public.game_results(user_id, stage_id, score desc);

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (id, email, name, school, course)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'school', ''),
    coalesce(new.raw_user_meta_data ->> 'course', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    school = excluded.school,
    course = excluded.course;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function app_private.handle_new_user();

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

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
        and is_active = true
    ),
    false
  );
$$;

revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.public_profiles enable row level security;
alter table public.game_results enable row level security;

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.public_profiles to authenticated;
grant select, insert, update, delete on public.game_results to authenticated;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Admins can view profiles" on public.profiles;
create policy "Admins can view profiles"
on public.profiles
for select
to authenticated
using (app_private.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

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

drop policy if exists "Authenticated users can view game results" on public.game_results;
create policy "Authenticated users can view game results"
on public.game_results
for select
to authenticated
using (true);

drop policy if exists "Users can insert own game results" on public.game_results;
create policy "Users can insert own game results"
on public.game_results
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can update game results" on public.game_results;
create policy "Admins can update game results"
on public.game_results
for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "Admins can delete game results" on public.game_results;
create policy "Admins can delete game results"
on public.game_results
for delete
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
