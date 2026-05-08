-- Phase 5: address geocode metadata, distance helpers for browse, safer public projection, discovery RLS.

alter table public.addresses
  add column if not exists geocoded_at timestamptz;

comment on column public.addresses.geocoded_at is
  'Timestamp of last successful coordinate fill; recomputed after address normalization changes via app geocode job.';

create extension if not exists cube;
create extension if not exists earthdistance cascade;

drop index if exists public.idx_addresses_geo_active;
create index idx_addresses_geo_active on public.addresses
  using gist (ll_to_earth(latitude::double precision, longitude::double precision))
  where deleted_at is null
    and latitude is not null
    and longitude is not null;

create or replace function public.distance_miles(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select case
    when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null
    else (
      earth_distance(
        ll_to_earth(lat1, lng1),
        ll_to_earth(lat2, lng2)
      ) / 1609.344
    )::double precision
  end;
$$;

-- Column-safe read model for discovery UIs (no Stripe, tax blobs, SMS flags, search vector).
drop view if exists public.cleaner_profiles_public;
create view public.cleaner_profiles_public
with (security_invoker = true) as
select
  cp.id,
  cp.user_id,
  cp.bio,
  cp.profile_photo_url,
  cp.languages,
  cp.hourly_rates_cents,
  cp.current_tier,
  cp.current_score,
  cp.tier_set_at,
  cp.score_updated_at,
  cp.is_veteran,
  cp.buffer_minutes,
  cp.booking_lead_time_hours,
  cp.is_active,
  cp.average_rating,
  cp.review_count,
  cp.completed_booking_count,
  cp.cleaner_since_at,
  cp.home_address_id,
  cp.created_at,
  cp.updated_at
from public.cleaner_profiles cp
where cp.deleted_at is null
  and cp.is_active is true;

grant select on public.cleaner_profiles_public to anon, authenticated, service_role;

-- Authenticated users may read approved active cleaner rows for browse / matching.
drop policy if exists cleaner_profiles_select_discovery on public.cleaner_profiles;
create policy cleaner_profiles_select_discovery
on public.cleaner_profiles
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or (
    is_active is true
    and deleted_at is null
    and exists (
      select 1
      from public.cleaner_applications ca
      where ca.cleaner_profile_id = cleaner_profiles.id
        and ca.state = 'approved'
    )
  )
);
