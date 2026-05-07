-- =============================================================================
-- Phase 3a: customer/address RLS policies
-- =============================================================================
-- Enforces per-customer row access for customer_profiles + addresses.
-- =============================================================================

alter table public.customer_profiles enable row level security;
alter table public.addresses enable row level security;

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

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
on public.addresses
for select
to authenticated
using (owner_user_id = auth.uid() and deleted_at is null);

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
