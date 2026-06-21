'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { notifyBookingParty } from '@/features/notifications/dispatch';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { submitReviewSchema } from './validation';

export type ReviewActionState = { ok: boolean; error: string | null };

export const submitReviewAction = async (
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> => {
  const traitIds = formData.getAll('trait_ids').map(String).filter(Boolean);
  const parsed = submitReviewSchema.safeParse({
    booking_id: formData.get('booking_id'),
    stars: Number(formData.get('stars')),
    body: formData.get('body') || undefined,
    trait_ids: traitIds,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: customerProfile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!customerProfile) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, cleaner_id, state')
    .eq('id', parsed.data.booking_id)
    .eq('customer_id', customerProfile.id)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };

  const reviewableStates = ['approved', 'auto_approved', 'paid', 'disputed', 'dispute_resolved'];
  if (!reviewableStates.includes(booking.state)) {
    return { ok: false, error: 'This booking cannot be reviewed yet.' };
  }
  if (!booking.cleaner_id) return { ok: false, error: 'No cleaner assigned to this booking.' };

  const { data: existing } = await admin
    .from('reviews')
    .select('id')
    .eq('booking_id', parsed.data.booking_id)
    .maybeSingle();
  if (existing) return { ok: false, error: 'You have already reviewed this booking.' };

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: parsed.data.booking_id,
      customer_id: customerProfile.id,
      cleaner_id: booking.cleaner_id,
      stars: parsed.data.stars,
      body: parsed.data.body ?? null,
    })
    .select('id')
    .single();

  if (error || !review) return { ok: false, error: error?.message ?? 'Failed to submit review.' };

  if (parsed.data.trait_ids.length > 0) {
    await supabase.from('review_traits').insert(
      parsed.data.trait_ids.map((traitId) => ({
        review_id: review.id,
        trait_id: traitId,
        cleaner_id: booking.cleaner_id as string,
      })),
    );
  }

  const { data: stats } = await admin
    .from('reviews')
    .select('stars')
    .eq('cleaner_id', booking.cleaner_id)
    .eq('is_public', true)
    .is('hidden_at', null);

  if (stats && stats.length > 0) {
    const avg = stats.reduce((sum, r) => sum + r.stars, 0) / stats.length;
    await admin
      .from('cleaner_profiles')
      .update({ average_rating: avg, review_count: stats.length })
      .eq('id', booking.cleaner_id);
  }

  void notifyBookingParty(parsed.data.booking_id, 'cleaner', {
    type: 'review_received',
    title: 'New review',
    body: `You received a ${parsed.data.stars}-star review.`,
    deepLink: '/app/cleaner/score',
  });

  revalidatePath(`/app/bookings/${parsed.data.booking_id}`);
  // After a positive review, offer an optional tip; otherwise return to the booking.
  if (['paid', 'approved', 'auto_approved'].includes(booking.state) && parsed.data.stars >= 4) {
    redirect(`/app/bookings/${parsed.data.booking_id}/tip?reviewed=1`);
  }
  redirect(`/app/bookings/${parsed.data.booking_id}?reviewed=1`);
};
