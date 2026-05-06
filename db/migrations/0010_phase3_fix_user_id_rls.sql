-- =============================================================================
-- Phase 3: Fix public.users.id to align with auth.users.id
-- =============================================================================
-- All RLS policies check (id = auth.uid()), but the Phase 2 trigger used
-- gen_random_uuid() for users.id, so auth.uid() never matched. This migration
-- updates the trigger to INSERT with id = new.id so every RLS check passes.
--
-- After applying: delete existing test auth users from the Supabase dashboard
-- and re-register so they receive a correctly linked public.users row.
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_full_name text;
  synced_user_id    uuid;
begin
  derived_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  if derived_full_name is null then
    derived_full_name := split_part(new.email, '@', 1);
  end if;

  insert into public.users (
    id,
    clerk_user_id,
    email,
    full_name,
    primary_role,
    status
  )
  values (
    new.id,
    new.id::text,
    new.email,
    derived_full_name,
    'customer',
    'active'
  )
  on conflict (email) do update
    set clerk_user_id = excluded.clerk_user_id,
        full_name     = excluded.full_name,
        updated_at    = now()
  returning id into synced_user_id;

  insert into public.customer_profiles (user_id)
  values (synced_user_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Creates/syncs public.users (id = auth.uid()) + customer_profiles rows after auth.users inserts.';
