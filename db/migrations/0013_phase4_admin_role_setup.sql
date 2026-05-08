-- Phase 4f admin access and policy extensions.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
  );
$$;

alter table public.admin_profiles enable row level security;

drop policy if exists "admin_profiles_select_self" on public.admin_profiles;
create policy "admin_profiles_select_self"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "cleaner_applications_select_admin" on public.cleaner_applications;
create policy "cleaner_applications_select_admin"
on public.cleaner_applications
for select
to authenticated
using (public.is_admin());

drop policy if exists "cleaner_applications_update_admin" on public.cleaner_applications;
create policy "cleaner_applications_update_admin"
on public.cleaner_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "background_checks_select_admin" on public.background_checks;
create policy "background_checks_select_admin"
on public.background_checks
for select
to authenticated
using (public.is_admin());

drop policy if exists "identity_verifications_select_admin" on public.identity_verifications;
create policy "identity_verifications_select_admin"
on public.identity_verifications
for select
to authenticated
using (public.is_admin());

drop policy if exists "cleaner_profiles_select_admin" on public.cleaner_profiles;
create policy "cleaner_profiles_select_admin"
on public.cleaner_profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "customer_profiles_select_admin" on public.customer_profiles;
create policy "customer_profiles_select_admin"
on public.customer_profiles
for select
to authenticated
using (public.is_admin());
