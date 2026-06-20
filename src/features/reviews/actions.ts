'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { submitReviewSchema } from './validation';

export type ReviewActionState = { ok: boolean; error: string | null };

const REVIEWABLE_STATES = ['approved', 'auto_approved', 'paid', 'dispute_resolved'];

export const submitReviewAction = async (
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> => {
  const parsed = submitReviewSchema.safeParse({
    booking_id: formData.get('booking_id'),
    stars: formData.get('stars'),
    body: formData.get('body') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!customer) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, customer_id, cleaner_id')
    .eq('id', parsed.data.booking_id)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.customer_id !== customer.id) return { ok: false, error: 'Not your booking.' };
  if (!booking.cleaner_id) return { ok: false, error: 'No cleaner on this booking.' };
  if (!REVIEWABLE_STATES.includes(booking.state)) {
    return { ok: false, error: 'Booking must be completed before reviewing.' };
  }

  const { data: existing } = await admin
    .from('reviews')
    .select('id')
    .eq('booking_id', booking.id)
    .maybeSingle();
  if (existing) return { ok: false, error: 'Review already submitted for this booking.' };

  const { error: insertError } = await admin.from('reviews').insert({
    booking_id: booking.id,
    customer_id: customer.id,
    cleaner_id: booking.cleaner_id,
    stars: parsed.data.stars,
    body: parsed.data.body ?? null,
  });
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath(`/app/bookings/${booking.id}`);
  revalidatePath(`/app/cleaners/${booking.cleaner_id}`);
  return { ok: true, error: null };
};
