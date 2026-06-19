'use server';

import { revalidatePath } from 'next/cache';

import { isStripeConfigured } from '@/lib/stripe/client';
import { authorizePaymentPlaceholder, capturePaymentPlaceholder } from '@/lib/stripe/placeholders';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PaymentActionState = { ok: boolean; error: string | null };

/**
 * Phase 7 placeholder. Moves a `pending_payment_authorization` booking to
 * `booking_requested` (success) or `charge_failed` (failure) using the
 * placeholder Stripe layer. Replace with a real PaymentIntent.create call
 * (capture_method: 'manual') once `stripe` is installed.
 */
export const authorizeBookingPaymentAction = async (
  bookingId: string,
): Promise<PaymentActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, total_charge_cents')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'pending_payment_authorization') {
    return { ok: false, error: 'Booking is not awaiting payment authorization.' };
  }

  const auth = isStripeConfigured()
    ? { ok: false as const, error: 'Real Stripe path not yet implemented (Phase 7).' }
    : await authorizePaymentPlaceholder(bookingId, booking.total_charge_cents);

  const admin = createSupabaseAdminClient();

  if (!auth.ok) {
    await admin.from('bookings').update({ state: 'charge_failed' }).eq('id', bookingId);
    await admin.from('booking_state_events').insert({
      booking_id: bookingId,
      previous_state: 'pending_payment_authorization',
      new_state: 'charge_failed',
      triggered_by_user_id: user.id,
      reason: `Payment auth failed: ${auth.error}`,
    });
    return { ok: false, error: auth.error };
  }

  await admin.from('bookings').update({ state: 'booking_requested' }).eq('id', bookingId);
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'pending_payment_authorization',
    new_state: 'booking_requested',
    triggered_by_user_id: user.id,
    reason: `Payment authorized via placeholder (intent ${auth.paymentIntentId}).`,
  });

  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};

/**
 * Phase 7 placeholder. Captures funds after customer approval. Real impl will
 * call PaymentIntent.capture and listen for the webhook to flip state to `paid`.
 */
export const captureBookingPaymentAction = async (
  bookingId: string,
): Promise<PaymentActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, total_charge_cents')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  const capturableStates = ['approved', 'auto_approved', 'dispute_resolved'];
  if (!capturableStates.includes(booking.state)) {
    return { ok: false, error: 'Booking is not ready for capture.' };
  }

  const capture = isStripeConfigured()
    ? { ok: false as const, error: 'Real Stripe path not yet implemented (Phase 7).' }
    : await capturePaymentPlaceholder(`pi_placeholder_${bookingId}`, booking.total_charge_cents);

  if (!capture.ok) return { ok: false, error: capture.error };

  const admin = createSupabaseAdminClient();
  await admin.from('bookings').update({ state: 'paid' }).eq('id', bookingId);
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: booking.state,
    new_state: 'paid',
    triggered_by_user_id: user.id,
    reason: `Payment captured via placeholder (${capture.capturedCents}¢).`,
  });

  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};
