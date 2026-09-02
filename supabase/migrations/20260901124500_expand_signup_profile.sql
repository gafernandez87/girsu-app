alter table public.profiles
add column if not exists birth_date date,
add column if not exists province text not null default 'Jujuy',
add column if not exists locality text not null default '',
add column if not exists school_membership text not null default 'jujuy_school',
add column if not exists school_role text not null default '',
add column if not exists waste_separation text[] not null default '{}'::text[],
add column if not exists composting text[] not null default '{}'::text[];

create index if not exists profiles_locality_idx on public.profiles(locality);
create index if not exists profiles_school_membership_idx on public.profiles(school_membership);
create index if not exists profiles_school_role_idx on public.profiles(school_role);

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  requested_school_id text;
  selected_school_id uuid;
  selected_school_name text;
  selected_school_membership text;
  selected_school_role text;
begin
  selected_school_membership := coalesce(nullif(new.raw_user_meta_data ->> 'school_membership', ''), 'jujuy_school');
  selected_school_role := coalesce(new.raw_user_meta_data ->> 'school_role', new.raw_user_meta_data ->> 'course', '');
  requested_school_id := coalesce(new.raw_user_meta_data ->> 'school_id', '');

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
    coalesce(nullif(new.raw_user_meta_data ->> 'province', ''), 'Jujuy'),
    coalesce(new.raw_user_meta_data ->> 'locality', ''),
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
