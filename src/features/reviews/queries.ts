import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TraitRow = {
  id: string;
  key: string;
  display_label: string;
  display_order: number;
};

export type ReviewRow = {
  id: string;
  stars: number;
  body: string | null;
  submitted_at: string;
  traits: { display_label: string }[];
  customer_name: string;
};

export const getActiveTraits = async (): Promise<TraitRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('traits')
    .select('id, key, display_label, display_order')
    .eq('is_active', true)
    .order('display_order');
  return data ?? [];
};

export const getReviewForBooking = async (bookingId: string): Promise<{ id: string } | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle();
  return data ?? null;
};

export const getCleanerReviews = async (cleanerId: string, limit = 10): Promise<ReviewRow[]> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('reviews')
    .select(
      `id, stars, body, submitted_at,
       review_traits(traits(display_label)),
       customer_profiles!reviews_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('cleaner_id', cleanerId)
    .eq('is_public', true)
    .is('hidden_at', null)
    .order('submitted_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const customerProfile = Array.isArray(row.customer_profiles)
      ? row.customer_profiles[0]
      : row.customer_profiles;
    const customerUser = customerProfile
      ? Array.isArray((customerProfile as { users: unknown }).users)
        ? ((customerProfile as { users: { full_name: string }[] }).users[0] ?? null)
        : ((customerProfile as { users: { full_name: string } | null }).users ?? null)
      : null;
    const traits = (row.review_traits ?? []).flatMap((rt) => {
      const rtTyped = rt as { traits: unknown };
      const t = Array.isArray(rtTyped.traits)
        ? ((rtTyped.traits as { display_label: string }[])[0] ?? null)
        : ((rtTyped.traits as { display_label: string } | null) ?? null);
      return t ? [{ display_label: t.display_label }] : [];
    });

    return {
      id: row.id,
      stars: row.stars,
      body: row.body ?? null,
      submitted_at: row.submitted_at,
      traits,
      customer_name: (customerUser as { full_name: string } | null)?.full_name ?? 'Customer',
    };
  });
};
