import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PublicReview = {
  id: string;
  stars: number;
  body: string | null;
  submitted_at: string;
  customer_first_name: string;
};

export const getReviewsForCleaner = async (cleanerId: string): Promise<PublicReview[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reviews')
    .select(
      `id, stars, body, submitted_at,
       customer_profiles!reviews_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('cleaner_id', cleanerId)
    .eq('is_public', true)
    .is('hidden_at', null)
    .order('submitted_at', { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.customer_profiles)
      ? row.customer_profiles[0]
      : row.customer_profiles;
    const userObj = profile
      ? Array.isArray((profile as { users: unknown }).users)
        ? ((profile as { users: { full_name: string }[] }).users[0] ?? null)
        : ((profile as { users: { full_name: string } | null }).users ?? null)
      : null;
    const fullName = (userObj as { full_name: string } | null)?.full_name ?? 'Customer';
    return {
      id: row.id,
      stars: row.stars,
      body: row.body ?? null,
      submitted_at: row.submitted_at,
      customer_first_name: fullName.split(' ')[0] ?? 'Customer',
    };
  });
};

export const getReviewForBooking = async (bookingId: string) => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('reviews')
    .select('id, stars, body, submitted_at')
    .eq('booking_id', bookingId)
    .maybeSingle();
  return data ?? null;
};
