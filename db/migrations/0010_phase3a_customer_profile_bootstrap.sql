-- =============================================================================
-- Phase 3a: customer_profiles bootstrap
-- =============================================================================
-- Creates customer_profiles rows for customer users through:
-- 1) Trigger on public.users inserts (customer role)
-- 2) One-time backfill for existing customer rows
-- =============================================================================

create or replace function public.handle_new_customer_user()
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

drop trigger if exists on_customer_user_created on public.users;

create trigger on_customer_user_created
  after insert on public.users
  for each row
  execute procedure public.handle_new_customer_user();

insert into public.customer_profiles (user_id, photo_policy, skip_photo_rooms)
select u.id, 'default', '{}'::text[]
from public.users u
where u.primary_role = 'customer'
  and not exists (
    select 1 from public.customer_profiles cp where cp.user_id = u.id
  )
on conflict (user_id) do nothing;
