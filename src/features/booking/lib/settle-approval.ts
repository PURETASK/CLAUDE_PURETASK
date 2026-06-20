import { isStripeConfigured } from '@/lib/integrations';
import { getStripe } from '@/lib/stripe/webhooks';
import type { createSupabaseAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type SettleResult = { ok: true } | { ok: false; error: string };

/**
 * Settle an approved booking: capture the held PaymentIntent, advance the
 * booking to a paid/terminal state, log the transition, and create the
 * cleaner's payout line item.
 *
 * Shared by the manual customer-approval action and the auto-approval cron so
 * BOTH paths actually move money. (Previously the cron only wrote a state
 * event — funds were never captured and the cleaner was never paid.)
 *
 * Capture-safe: if the Stripe capture fails, the booking is NOT advanced and no
 * payout is created, and an error is returned. The money was never taken, so
 * the booking stays in `awaiting_approval` for retry / admin handling.
 *
 * @param newState `'paid'` for manual approval, `'auto_approved'` for the cron.
 * @param actorUserId the approving customer's user id, or `null` for the system cron.
 */
export async function settleApprovedBooking(
  admin: AdminClient,
  opts: {
    bookingId: string;
    newState: 'paid' | 'auto_approved';
    actorUserId: string | null;
    reason: string;
  },
): Promise<SettleResult> {
  const { bookingId, newState, actorUserId, reason } = opts;

  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id, cleaner_payout_cents, booking_number')
    .eq('id', bookingId)
    .single();
  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'awaiting_approval')
    return { ok: false, error: 'Booking is not awaiting approval.' };

  const now = new Date().toISOString();

  // Capture the held PaymentIntent. If capture fails, abort WITHOUT advancing
  // the booking or creating a payout — the funds were never taken.
  const { data: charge } = await admin
    .from('charges')
    .select('id, stripe_payment_intent_id, state')
    .eq('booking_id', bookingId)
    .is('tip_id', null)
    .maybeSingle();

  if (isStripeConfigured() && charge?.stripe_payment_intent_id && charge.state === 'authorized') {
    try {
      await getStripe().paymentIntents.capture(charge.stripe_payment_intent_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment capture failed.';
      return { ok: false, error: `Could not capture payment: ${msg}` };
    }
    await admin.from('charges').update({ state: 'captured', captured_at: now }).eq('id', charge.id);
  }

  const disputeWindowEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const approvalTimestamp =
    newState === 'paid' ? { customer_approved_at: now } : { auto_approved_at: now };

  const { error: updErr } = await admin
    .from('bookings')
    .update({ state: newState, ...approvalTimestamp, dispute_window_ends_at: disputeWindowEndsAt })
    .eq('id', bookingId);
  if (updErr) return { ok: false, error: updErr.message };

  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'awaiting_approval',
    new_state: newState,
    triggered_by_user_id: actorUserId,
    triggered_by_system: actorUserId ? null : 'auto_approval_cron',
    reason,
  });

  if (booking.cleaner_payout_cents > 0 && booking.cleaner_id) {
    await admin.from('payout_line_items').insert({
      cleaner_id: booking.cleaner_id,
      booking_id: bookingId,
      amount_cents: booking.cleaner_payout_cents,
      description: `Earnings from booking ${booking.booking_number}`,
      earned_at: now,
      currency: 'usd',
      is_instant: false,
    });
  }

  return { ok: true };
}
