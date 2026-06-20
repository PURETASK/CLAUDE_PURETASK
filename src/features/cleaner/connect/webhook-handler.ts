import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type StripeEvent = {
  type: string;
  data?: { object?: Record<string, unknown> };
};

/**
 * Stripe platform webhook handler.
 *
 * Reconciles two things the in-process server actions can't guarantee on their
 * own (network failure mid-write, async 3DS, out-of-band refunds):
 *   1. Connected-account onboarding (`account.updated`)
 *   2. Booking PaymentIntent lifecycle + refunds → the `charges` ledger
 *
 * Charge rows are keyed by `stripe_payment_intent_id`, so the ledger converges
 * to Stripe's truth even if an action's DB write was lost.
 */
export const handleStripeConnectEvent = async (event: StripeEvent) => {
  const admin = createSupabaseAdminClient();
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;

  // ---- Connected-account onboarding ----
  if (event.type === 'account.updated') {
    const applicationId = (obj.metadata as { application_id?: string } | undefined)?.application_id;
    if (!applicationId) return;

    // Only mark onboarding COMPLETE when the account can actually take charges
    // and finished onboarding — `account.updated` also fires while the account
    // is still restricted/incomplete. Marking complete early would let an
    // un-payable cleaner be treated as ready.
    const ready = obj.charges_enabled === true && obj.details_submitted === true;
    await admin
      .from('cleaner_applications')
      .update({
        pending_stripe_account_id: (obj.id as string) ?? null,
        stripe_onboarding_completed_at: ready ? new Date().toISOString() : null,
      })
      .eq('id', applicationId);
    return;
  }

  // ---- Booking PaymentIntent lifecycle → charges ledger ----
  if (event.type.startsWith('payment_intent.')) {
    const piId = obj.id as string | undefined;
    if (!piId) return;
    const byPi = () => admin.from('charges');
    const now = new Date().toISOString();

    if (event.type === 'payment_intent.amount_capturable_updated') {
      await byPi().update({ state: 'authorized' }).eq('stripe_payment_intent_id', piId);
    } else if (event.type === 'payment_intent.succeeded') {
      await byPi()
        .update({ state: 'captured', captured_at: now })
        .eq('stripe_payment_intent_id', piId);
    } else if (event.type === 'payment_intent.payment_failed') {
      await byPi().update({ state: 'failed' }).eq('stripe_payment_intent_id', piId);
    } else if (event.type === 'payment_intent.canceled') {
      await byPi().update({ state: 'cancelled' }).eq('stripe_payment_intent_id', piId);
    }
    return;
  }

  // ---- Refunds → charges + refunds ledger ----
  if (event.type === 'charge.refunded') {
    const piId = obj.payment_intent as string | undefined;
    if (!piId) return;
    const amount = (obj.amount as number | undefined) ?? 0;
    const amountRefunded = (obj.amount_refunded as number | undefined) ?? 0;
    const fully = amount > 0 && amountRefunded >= amount;

    await admin
      .from('charges')
      .update({ state: fully ? 'refunded' : 'partially_refunded' })
      .eq('stripe_payment_intent_id', piId);

    const { data: charge } = await admin
      .from('charges')
      .select('id')
      .eq('stripe_payment_intent_id', piId)
      .maybeSingle();
    if (charge) {
      await admin
        .from('refunds')
        .update({ state: 'succeeded', succeeded_at: new Date().toISOString() })
        .eq('charge_id', charge.id)
        .eq('state', 'pending');
    }
    return;
  }
};
