-- Phase 4a/4b foundation:
-- - deterministic cleaner application number generation
-- - auto-create draft cleaner applications for cleaner-role users
-- - create cleaner profile on approval transition
-- - baseline RLS policies for cleaner onboarding tables

create sequence if not exists public.cleaner_application_number_seq;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_full_name text;
  derived_role public.user_role;
  synced_user_id uuid;
begin
  derived_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  if derived_full_name is null then
    derived_full_name := split_part(new.email, '@', 1);
  end if;

  derived_role := case
    when (new.raw_user_meta_data ->> 'role') in ('customer', 'cleaner', 'admin') then
      (new.raw_user_meta_data ->> 'role')::public.user_role
    else
      'customer'::public.user_role
  end;

  insert into public.users (clerk_user_id, email, full_name, primary_role, status)
  values (new.id::text, new.email, derived_full_name, derived_role, 'active')
  on conflict (email) do update
    set clerk_user_id = excluded.clerk_user_id,
        full_name = excluded.full_name,
        primary_role = excluded.primary_role,
        updated_at = now()
  returning id into synced_user_id;

  if derived_role = 'customer' then
    insert into public.customer_profiles (user_id)
    values (synced_user_id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.generate_cleaner_application_number()
returns text
language plpgsql
as $$
declare
  year_part text;
  seq_part text;
begin
  year_part := to_char(now(), 'YYYY');
  seq_part := lpad(nextval('public.cleaner_application_number_seq')::text, 6, '0');
  return 'APP-' || year_part || '-' || seq_part;
end;
$$;

create or replace function public.handle_new_cleaner_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.primary_role = 'cleaner' then
    insert into public.cleaner_applications (user_id, application_number, state, application_data)
    values (
      new.id,
      public.generate_cleaner_application_number(),
      'draft',
      '{}'::jsonb
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_cleaner_user_created on public.users;
create trigger on_cleaner_user_created
after insert on public.users
for each row
execute procedure public.handle_new_cleaner_user();

create or replace function public.handle_cleaner_application_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_cleaner_profile_id uuid;
begin
  if old.state <> 'approved' and new.state = 'approved' then
    insert into public.cleaner_profiles (user_id)
    values (new.user_id)
    on conflict (user_id) do update set user_id = excluded.user_id
    returning id into new_cleaner_profile_id;

    update public.cleaner_applications
    set cleaner_profile_id = new_cleaner_profile_id
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_cleaner_application_approved on public.cleaner_applications;
create trigger on_cleaner_application_approved
after update on public.cleaner_applications
for each row
execute procedure public.handle_cleaner_application_approved();

alter table public.cleaner_applications enable row level security;
alter table public.background_checks enable row level security;
alter table public.identity_verifications enable row level security;
alter table public.cleaner_profiles enable row level security;

drop policy if exists "cleaner_applications_select_own" on public.cleaner_applications;
create policy "cleaner_applications_select_own"
on public.cleaner_applications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "cleaner_applications_update_own_draft" on public.cleaner_applications;
create policy "cleaner_applications_update_own_draft"
on public.cleaner_applications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "background_checks_select_own" on public.background_checks;
create policy "background_checks_select_own"
on public.background_checks
for select
to authenticated
using (subject_user_id = auth.uid());

drop policy if exists "identity_verifications_select_own" on public.identity_verifications;
create policy "identity_verifications_select_own"
on public.identity_verifications
for select
to authenticated
using (subject_user_id = auth.uid());

drop policy if exists "cleaner_profiles_select_own" on public.cleaner_profiles;
create policy "cleaner_profiles_select_own"
on public.cleaner_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "cleaner_profiles_update_own" on public.cleaner_profiles;
create policy "cleaner_profiles_update_own"
on public.cleaner_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
