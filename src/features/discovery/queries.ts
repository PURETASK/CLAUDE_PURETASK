import { createSupabaseServerClient } from '@/lib/supabase/server';

import type { BrowseSearchInput } from '@/features/discovery/validation';

/** Same spherical assumption as Postgres earthdistance for browse consistency. */
export const haversineMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

export type CustomerDiscoveryAnchor = {
  latitude: number | null;
  longitude: number | null;
  zipCode: string | null;
};

export const getCustomerDiscoveryAnchor = async (): Promise<CustomerDiscoveryAnchor | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('default_address_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile?.default_address_id) {
    return { latitude: null, longitude: null, zipCode: null };
  }

  const { data: addr } = await supabase
    .from('addresses')
    .select('latitude, longitude, zip_code')
    .eq('id', profile.default_address_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!addr) return { latitude: null, longitude: null, zipCode: null };

  return {
    latitude: addr.latitude,
    longitude: addr.longitude,
    zipCode: addr.zip_code ?? null,
  };
};

export type CleanerBrowseRow = {
  id: string;
  user_id: string;
  created_at: string;
  full_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  current_tier: 'rising_pro' | 'proven_specialist' | 'top_performer' | 'all_star_expert';
  average_rating: number | null;
  review_count: number;
  hourly_rates_cents: Record<string, number>;
  completed_booking_count: number;
  cleaner_since_at: string;
  home_latitude: number | null;
  home_longitude: number | null;
  service_zip_codes: string[];
  specialty_keys: string[];
};

const mapCleanerRow = (row: {
  id: string;
  user_id: string;
  created_at: string;
  bio: string | null;
  profile_photo_url: string | null;
  current_tier: CleanerBrowseRow['current_tier'];
  average_rating: number | null;
  review_count: number;
  hourly_rates_cents: unknown;
  completed_booking_count: number;
  cleaner_since_at: string;
  users: unknown;
  cleaner_service_zips: unknown;
  addresses: unknown;
  cleaner_specialties: unknown;
}): CleanerBrowseRow => {
  const user = Array.isArray(row.users) ? row.users[0] : row.users;
  const zips: string[] = Array.isArray(row.cleaner_service_zips)
    ? row.cleaner_service_zips.map((z: { zip_code: string }) => z.zip_code)
    : [];
  const home = Array.isArray(row.addresses) ? row.addresses[0] : row.addresses;
  const homeLat =
    home && typeof home === 'object' && 'latitude' in home
      ? (home as { latitude: number | null }).latitude
      : null;
  const homeLng =
    home && typeof home === 'object' && 'longitude' in home
      ? (home as { longitude: number | null }).longitude
      : null;

  const specialty_keys = Array.isArray(row.cleaner_specialties)
    ? row.cleaner_specialties
        .filter((cs: { lost_at: string | null }) => cs.lost_at == null)
        .map((cs: { specialties: { key: string } | null }) => cs.specialties?.key)
        .filter((k): k is string => Boolean(k))
    : [];

  return {
    id: row.id,
    user_id: row.user_id,
    created_at: row.created_at,
    full_name: (user as { full_name: string } | null)?.full_name ?? 'Cleaner',
    bio: row.bio ?? null,
    profile_photo_url: row.profile_photo_url ?? null,
    current_tier: row.current_tier,
    average_rating: row.average_rating ?? null,
    review_count: row.review_count,
    hourly_rates_cents: (row.hourly_rates_cents ?? {}) as Record<string, number>,
    completed_booking_count: row.completed_booking_count,
    cleaner_since_at: row.cleaner_since_at,
    home_latitude: homeLat,
    home_longitude: homeLng,
    service_zip_codes: zips,
    specialty_keys,
  };
};

export const getZipCoverageState = async (
  zip: string | null | undefined,
): Promise<'active' | 'seo_only' | 'waitlist' | 'inactive' | 'unknown'> => {
  if (!zip?.trim()) return 'unknown';
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('serviced_areas')
    .select('status')
    .eq('zip_code', zip.trim())
    .maybeSingle();

  if (!data?.status) return 'inactive';
  return data.status as 'active' | 'seo_only' | 'waitlist' | 'inactive';
};

export const browseCleaners = async (opts: BrowseSearchInput): Promise<CleanerBrowseRow[]> => {
  const supabase = await createSupabaseServerClient();
  const anchor = await getCustomerDiscoveryAnchor();

  const { data, error } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, user_id, created_at, bio, profile_photo_url, current_tier, average_rating, review_count,
       hourly_rates_cents, completed_booking_count, cleaner_since_at, home_address_id,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips(zip_code),
       addresses!fk_cleaner_home_address(latitude, longitude),
       cleaner_specialties(lost_at, specialties(key))`,
    )
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error || !data) return [];

  return data
    .map((row) =>
      mapCleanerRow({
        ...row,
        current_tier: row.current_tier as CleanerBrowseRow['current_tier'],
      }),
    )
    .filter((r) => {
      if (opts.services.length === 0) return true;
      return opts.services.some((svc) => (r.hourly_rates_cents[svc] ?? 0) > 0);
    })
    .filter((r) => {
      if (opts.min_rating === 0) return true;
      if (r.average_rating == null) return false;
      return r.average_rating >= opts.min_rating;
    })
    .filter((r) => {
      const offered = Object.values(r.hourly_rates_cents).filter((c) => c > 0);
      if (offered.length === 0) return false;
      const minOffered = Math.min(...offered) / 100;
      const maxOffered = Math.max(...offered) / 100;
      if (opts.min_rate != null && maxOffered < opts.min_rate) return false;
      if (opts.max_rate != null && minOffered > opts.max_rate) return false;
      return true;
    })
    .filter((r) => {
      // Service-area (ZIP) coverage: if we know the customer's ZIP and the
      // cleaner has declared a service area, require coverage. Cleaners who have
      // not set any service ZIPs are not hidden here — they fall back to the
      // distance check below.
      const customerZip = anchor?.zipCode?.trim();
      if (!customerZip) return true;
      if (r.service_zip_codes.length === 0) return true;
      return r.service_zip_codes.includes(customerZip);
    })
    .filter((r) => {
      if (
        anchor?.latitude != null &&
        anchor.longitude != null &&
        r.home_latitude != null &&
        r.home_longitude != null
      ) {
        const mi = haversineMiles(
          anchor.latitude,
          anchor.longitude,
          r.home_latitude,
          r.home_longitude,
        );
        return mi <= opts.max_miles;
      }
      if (anchor?.latitude != null && anchor?.longitude != null) {
        return false;
      }
      return true;
    });
};

export type CleanerProfileDetail = CleanerBrowseRow & {
  service_zips: string[];
  badges: { id: string; display_label: string; description: string; display_order: number }[];
  specialties: { id: string; key: string; display_label: string; description: string }[];
};

export const getCleanerProfileDetail = async (id: string): Promise<CleanerProfileDetail | null> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, user_id, created_at, bio, profile_photo_url, current_tier, average_rating, review_count,
       hourly_rates_cents, completed_booking_count, cleaner_since_at, home_address_id,
       buffer_minutes, booking_lead_time_hours,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips(zip_code),
       addresses!fk_cleaner_home_address(latitude, longitude),
       cleaner_badges!cleaner_badges_cleaner_id_fkey(
         lost_at,
         badges(id, display_label, description, display_order)
       ),
       cleaner_specialties(
         lost_at,
         specialties(id, key, display_label, description)
       )`,
    )
    .eq('id', id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;

  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  const zips: string[] = Array.isArray(data.cleaner_service_zips)
    ? data.cleaner_service_zips.map((z: { zip_code: string }) => z.zip_code)
    : [];
  const home = Array.isArray(data.addresses) ? data.addresses[0] : data.addresses;
  const homeLat =
    home && typeof home === 'object' && 'latitude' in home
      ? (home as { latitude: number | null }).latitude
      : null;
  const homeLng =
    home && typeof home === 'object' && 'longitude' in home
      ? (home as { longitude: number | null }).longitude
      : null;

  const badges = Array.isArray(data.cleaner_badges)
    ? data.cleaner_badges
        .filter((cb: { lost_at: string | null }) => cb.lost_at == null)
        .map(
          (cb: {
            badges: {
              id: string;
              display_label: string;
              description: string;
              display_order: number;
            } | null;
          }) => cb.badges,
        )
        .filter(
          (
            b,
          ): b is {
            id: string;
            display_label: string;
            description: string;
            display_order: number;
          } => b !== null,
        )
        .sort((a, b) => a.display_order - b.display_order)
    : [];

  const specialties = Array.isArray(data.cleaner_specialties)
    ? data.cleaner_specialties
        .filter((cs: { lost_at: string | null }) => cs.lost_at == null)
        .map(
          (cs: {
            specialties: {
              id: string;
              key: string;
              display_label: string;
              description: string;
            } | null;
          }) => cs.specialties,
        )
        .filter(
          (s): s is { id: string; key: string; display_label: string; description: string } =>
            s !== null,
        )
    : [];

  const specialty_keys = specialties.map((s) => s.key);

  const rates = (data.hourly_rates_cents ?? {}) as Record<string, number>;

  return {
    id: data.id,
    user_id: data.user_id,
    created_at: data.created_at,
    full_name: (user as { full_name: string } | null)?.full_name ?? 'Cleaner',
    bio: data.bio ?? null,
    profile_photo_url: data.profile_photo_url ?? null,
    current_tier: data.current_tier as CleanerBrowseRow['current_tier'],
    average_rating: data.average_rating ?? null,
    review_count: data.review_count,
    hourly_rates_cents: rates,
    completed_booking_count: data.completed_booking_count,
    cleaner_since_at: data.cleaner_since_at,
    home_latitude: homeLat,
    home_longitude: homeLng,
    service_zip_codes: zips,
    specialty_keys,
    service_zips: zips,
    badges,
    specialties,
  };
};

// Backward-compatible alias for existing route imports.
export const getCleanerProfile = getCleanerProfileDetail;

export const listFavorites = async (): Promise<CleanerBrowseRow[]> => {
  const supabase = await createSupabaseServerClient();

  const { data: favorites, error } = await supabase
    .from('customer_favorites')
    .select('cleaner_id')
    .is('deleted_at', null);

  if (error || !favorites || favorites.length === 0) return [];

  const ids = favorites.map((f) => f.cleaner_id);
  const { data, error: fetchError } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, user_id, created_at, bio, profile_photo_url, current_tier, average_rating, review_count,
       hourly_rates_cents, completed_booking_count, cleaner_since_at,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips(zip_code),
       addresses!fk_cleaner_home_address(latitude, longitude),
       cleaner_specialties(lost_at, specialties(key))`,
    )
    .in('id', ids)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (fetchError || !data) return [];

  return data.map((row) =>
    mapCleanerRow({
      ...row,
      current_tier: row.current_tier as CleanerBrowseRow['current_tier'],
    }),
  );
};

export const isCleanerFavoritedByCurrentCustomer = async (cleanerId: string): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customer_favorites')
    .select('id')
    .eq('cleaner_id', cleanerId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.id);
};

export const listRecentPublicReviewsForCleaner = async (
  cleanerId: string,
  limit = 5,
): Promise<{ id: string; stars: number; body: string | null; submitted_at: string }[]> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('reviews')
    .select('id, stars, body, submitted_at')
    .eq('cleaner_id', cleanerId)
    .eq('is_public', true)
    .is('hidden_at', null)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
};
