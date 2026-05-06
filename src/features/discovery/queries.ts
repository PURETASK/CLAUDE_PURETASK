import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CleanerListItem = {
  id: string;
  user_id: string;
  full_name: string;
  current_tier: 'rising_pro' | 'proven_specialist' | 'top_performer' | 'all_star_expert';
  average_rating: number | null;
  review_count: number;
  current_score: number;
  is_veteran: boolean;
  hourly_rates_cents: Record<string, number>;
  zip_covered: boolean;
};

export type CleanerProfile = CleanerListItem & {
  bio: string | null;
  profile_photo_url: string | null;
  cleaner_since_at: string;
  service_zips: string[];
  badges: { id: string; display_label: string; description: string; display_order: number }[];
  specialties: { id: string; display_label: string; description: string }[];
};

export const listCleaners = async (opts: {
  zip?: string;
  serviceType?: string;
}): Promise<CleanerListItem[]> => {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('cleaner_profiles')
    .select(
      `id, user_id, current_tier, average_rating, review_count, current_score,
       is_veteran, hourly_rates_cents,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips(zip_code)`,
    )
    .eq('is_active', true)
    .is('deleted_at', null);

  const { data, error } = await query;
  if (error || !data) return [];

  return data
    .map((row) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const zips: string[] = Array.isArray(row.cleaner_service_zips)
        ? row.cleaner_service_zips.map((z: { zip_code: string }) => z.zip_code)
        : [];
      const rates = (row.hourly_rates_cents ?? {}) as Record<string, number>;

      const passesServiceFilter = opts.serviceType
        ? opts.serviceType in rates && (rates[opts.serviceType] ?? 0) > 0
        : true;
      if (!passesServiceFilter) return null;

      return {
        id: row.id,
        user_id: row.user_id,
        full_name: (user as { full_name: string } | null)?.full_name ?? 'Cleaner',
        current_tier: row.current_tier as CleanerListItem['current_tier'],
        average_rating: row.average_rating ?? null,
        review_count: row.review_count,
        current_score: row.current_score,
        is_veteran: row.is_veteran,
        hourly_rates_cents: rates,
        zip_covered: opts.zip ? zips.includes(opts.zip) : true,
      };
    })
    .filter((x): x is CleanerListItem => x !== null);
};

export const getCleanerProfile = async (id: string): Promise<CleanerProfile | null> => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, user_id, current_tier, average_rating, review_count, current_score,
       is_veteran, hourly_rates_cents, bio, profile_photo_url, cleaner_since_at,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips(zip_code),
       cleaner_badges!cleaner_badges_cleaner_id_fkey(
         badges(id, display_label, description, display_order)
       ),
       cleaner_specialties!cleaner_specialties_cleaner_id_fkey(
         specialties(id, display_label, description)
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

  const badges = Array.isArray(data.cleaner_badges)
    ? data.cleaner_badges
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
        .map(
          (cs: {
            specialties: { id: string; display_label: string; description: string } | null;
          }) => cs.specialties,
        )
        .filter((s): s is { id: string; display_label: string; description: string } => s !== null)
    : [];

  const rates = (data.hourly_rates_cents ?? {}) as Record<string, number>;

  return {
    id: data.id,
    user_id: data.user_id,
    full_name: (user as { full_name: string } | null)?.full_name ?? 'Cleaner',
    current_tier: data.current_tier as CleanerListItem['current_tier'],
    average_rating: data.average_rating ?? null,
    review_count: data.review_count,
    current_score: data.current_score,
    is_veteran: data.is_veteran,
    hourly_rates_cents: rates,
    zip_covered: true,
    bio: data.bio ?? null,
    profile_photo_url: data.profile_photo_url ?? null,
    cleaner_since_at: data.cleaner_since_at,
    service_zips: zips,
    badges,
    specialties,
  };
};
