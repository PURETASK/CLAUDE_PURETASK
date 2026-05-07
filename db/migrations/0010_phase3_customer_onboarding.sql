-- =============================================================================
-- Phase 3: Customer onboarding bootstrap + RLS hardening
-- =============================================================================
-- This migration:
-- 1) Auto-creates customer_profiles rows for customer users.
-- 2) Backfills missing customer_profiles rows for existing customer users.
-- 3) Enables RLS + owner-scoped policies for customer_profiles and addresses.
-- 4) Leaves latitude/longitude null in Phase 3 (geocoding lands in Phase 5).
-- =============================================================================

create or replace function public.handle_customer_profile_from_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.primary_role = 'customer' then
    insert into public.customer_profiles (
      user_id,
      photo_policy,
      skip_photo_rooms
    )
    values (
      new.id,
      'default',
      '{}'::text[]
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

comment on function public.handle_customer_profile_from_user() is
  'Ensures every customer user has a customer_profiles row with phase-3 defaults.';

drop trigger if exists on_customer_user_created on public.users;

create trigger on_customer_user_created
  after insert on public.users
  for each row
  execute procedure public.handle_customer_profile_from_user();

-- Backfill pre-existing customer users (created before this trigger existed).
insert into public.customer_profiles (user_id, photo_policy, skip_photo_rooms)
select u.id, 'default', '{}'::text[]
from public.users u
left join public.customer_profiles cp on cp.user_id = u.id
where u.primary_role = 'customer'
  and cp.user_id is null;

-- ---------------------------------------------------------------------------
-- customer_profiles RLS
-- ---------------------------------------------------------------------------
alter table public.customer_profiles enable row level security;

drop policy if exists "customer_profiles_select_own" on public.customer_profiles;
create policy "customer_profiles_select_own"
on public.customer_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "customer_profiles_update_own" on public.customer_profiles;
create policy "customer_profiles_update_own"
on public.customer_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- No direct insert/delete policy by authenticated users in phase 3.

-- ---------------------------------------------------------------------------
-- addresses RLS
-- ---------------------------------------------------------------------------
alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
on public.addresses
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own"
on public.addresses
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and address_type = 'customer_service'
);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own"
on public.addresses
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- No direct delete policy in phase 3 (soft delete uses UPDATE deleted_at).
