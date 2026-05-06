-- =============================================================================
-- Phase 2: Supabase auth.users -> public.users sync
-- =============================================================================
-- Keeps application identity tables in sync with Supabase Auth events.
-- This migration intentionally defaults all new auth users to primary_role='customer'.
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_full_name text;
  synced_user_id uuid;
begin
  derived_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  if derived_full_name is null then
    derived_full_name := split_part(new.email, '@', 1);
  end if;

  insert into public.users (
    clerk_user_id,
    email,
    full_name,
    primary_role,
    status
  )
  values (
    new.id::text,
    new.email,
    derived_full_name,
    'customer',
    'active'
  )
  on conflict (email) do update
    set clerk_user_id = excluded.clerk_user_id,
        full_name = excluded.full_name,
        updated_at = now()
  returning id into synced_user_id;

  insert into public.customer_profiles (user_id)
  values (synced_user_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Creates/syncs public.users + customer_profiles rows after auth.users inserts.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
