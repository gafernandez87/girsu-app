create table if not exists public.jujuy_localities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  normalized_name text generated always as (upper(btrim(name))) stored,
  created_at timestamptz not null default now(),
  unique (normalized_name)
);

create index if not exists jujuy_localities_name_idx on public.jujuy_localities(name);

alter table public.jujuy_localities enable row level security;

grant select on public.jujuy_localities to anon, authenticated;

drop policy if exists "Anyone can view Jujuy localities" on public.jujuy_localities;
create policy "Anyone can view Jujuy localities"
on public.jujuy_localities
for select
to anon, authenticated
using (true);

insert into public.jujuy_localities (name)
select locality
from (
  select distinct on (upper(btrim(locality)))
    btrim(locality) as locality
  from public.schools
  where btrim(locality) <> ''
  order by upper(btrim(locality)), btrim(locality)
) as source_localities
on conflict (normalized_name) do nothing;

create or replace function app_private.sync_jujuy_locality_from_school()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if btrim(new.locality) <> '' then
    insert into public.jujuy_localities (name)
    values (btrim(new.locality))
    on conflict (normalized_name) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function app_private.sync_jujuy_locality_from_school() from public;

drop trigger if exists sync_jujuy_locality_from_school on public.schools;
create trigger sync_jujuy_locality_from_school
after insert or update of locality on public.schools
for each row
execute function app_private.sync_jujuy_locality_from_school();

alter table public.profiles
add column if not exists locality_id uuid references public.jujuy_localities(id) on delete restrict,
add column if not exists locality_source text not null default 'legacy';

create index if not exists profiles_locality_id_idx on public.profiles(locality_id);

alter table public.profiles
drop constraint if exists profiles_province_check,
add constraint profiles_province_check
check (province in ('Jujuy', 'Otra')) not valid,
drop constraint if exists profiles_locality_source_check,
add constraint profiles_locality_source_check
check (locality_source in ('jujuy_catalog', 'manual', 'legacy')) not valid,
drop constraint if exists profiles_jujuy_catalog_locality_check,
add constraint profiles_jujuy_catalog_locality_check
check (
  locality_source <> 'jujuy_catalog'
  or (province = 'Jujuy' and locality_id is not null)
) not valid,
drop constraint if exists profiles_manual_locality_check,
add constraint profiles_manual_locality_check
check (
  locality_source <> 'manual'
  or (province = 'Otra' and locality_id is null and btrim(locality) <> '')
) not valid;

update public.profiles as profile
set
  locality_id = locality.id,
  locality_source = 'jujuy_catalog'
from public.jujuy_localities as locality
where profile.province = 'Jujuy'
  and upper(btrim(profile.locality)) = locality.normalized_name;

alter table public.profiles validate constraint profiles_province_check;
alter table public.profiles validate constraint profiles_locality_source_check;
alter table public.profiles validate constraint profiles_jujuy_catalog_locality_check;
alter table public.profiles validate constraint profiles_manual_locality_check;

create or replace function app_private.normalize_profile_locality()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  locality_name text;
begin
  if new.locality_source = 'jujuy_catalog' then
    select name
    into locality_name
    from public.jujuy_localities
    where id = new.locality_id;

    if locality_name is null then
      raise exception 'La localidad de Jujuy seleccionada no existe.';
    end if;

    new.locality := locality_name;
  elsif new.locality_source = 'manual' then
    new.locality_id := null;
    new.locality := btrim(new.locality);
  end if;

  return new;
end;
$$;

revoke all on function app_private.normalize_profile_locality() from public;

drop trigger if exists normalize_profile_locality on public.profiles;
create trigger normalize_profile_locality
before insert or update of province, locality, locality_id, locality_source on public.profiles
for each row
execute function app_private.normalize_profile_locality();

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  requested_school_id text;
  requested_locality_id text;
  selected_locality_id uuid;
  selected_locality_name text;
  selected_locality_source text := 'legacy';
  selected_school_id uuid;
  selected_school_name text;
  selected_school_membership text;
  selected_school_role text;
  selected_province text;
  selected_locality text;
  is_self_signup boolean;
begin
  selected_province := coalesce(nullif(new.raw_user_meta_data ->> 'province', ''), 'Jujuy');
  selected_school_membership := coalesce(nullif(new.raw_user_meta_data ->> 'school_membership', ''), 'jujuy_school');
  selected_school_role := coalesce(new.raw_user_meta_data ->> 'school_role', new.raw_user_meta_data ->> 'course', '');
  requested_school_id := coalesce(new.raw_user_meta_data ->> 'school_id', '');
  requested_locality_id := coalesce(new.raw_user_meta_data ->> 'locality_id', '');
  selected_locality := btrim(coalesce(new.raw_user_meta_data ->> 'locality', ''));
  is_self_signup := coalesce(new.raw_user_meta_data ->> 'registration_flow', '') = 'self_signup';

  if selected_province not in ('Jujuy', 'Otra') then
    raise exception 'La provincia seleccionada no es valida.';
  end if;

  if selected_province = 'Jujuy'
    and requested_locality_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    select id, name
    into selected_locality_id, selected_locality_name
    from public.jujuy_localities
    where id = requested_locality_id::uuid;
  end if;

  if selected_province = 'Jujuy' and selected_locality_id is not null then
    selected_locality_source := 'jujuy_catalog';
  elsif selected_province = 'Otra' and selected_locality <> '' then
    selected_locality_source := 'manual';
  elsif is_self_signup then
    raise exception 'Completa una localidad valida para continuar.';
  end if;

  if selected_school_membership = 'jujuy_school'
    and requested_school_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    select id, name
    into selected_school_id, selected_school_name
    from public.schools
    where id = requested_school_id::uuid
      and is_active = true;
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    birth_date,
    province,
    locality,
    locality_id,
    locality_source,
    school_id,
    school_membership,
    school_role,
    school,
    course,
    waste_separation,
    composting
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    selected_province,
    coalesce(selected_locality_name, selected_locality),
    selected_locality_id,
    selected_locality_source,
    selected_school_id,
    selected_school_membership,
    selected_school_role,
    coalesce(selected_school_name, ''),
    selected_school_role,
    coalesce(array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'waste_separation', '[]'::jsonb))), '{}'::text[]),
    coalesce(array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'composting', '[]'::jsonb))), '{}'::text[])
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    birth_date = excluded.birth_date,
    province = excluded.province,
    locality = excluded.locality,
    locality_id = excluded.locality_id,
    locality_source = excluded.locality_source,
    school_id = excluded.school_id,
    school_membership = excluded.school_membership,
    school_role = excluded.school_role,
    school = excluded.school,
    course = excluded.course,
    waste_separation = excluded.waste_separation,
    composting = excluded.composting;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;
