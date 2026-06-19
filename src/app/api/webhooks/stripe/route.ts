import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

/**
 * Stripe webhook endpoint — Phase 7 stub.
 *
 * When real keys are wired up:
 *   1. Install `stripe`.
 *   2. Verify signature with `stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET)`.
 *   3. Dispatch on event.type (payment_intent.succeeded, .payment_failed, etc.)
 *      and reconcile booking state via the payments feature.
 *
 * For now this returns 200 in dev and 501 in prod-without-keys so misconfigured
 * deploys surface immediately rather than silently dropping events.
 */
export const POST = async (req: Request) => {
  const sig = req.headers.get('stripe-signature');

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { received: false, error: 'Stripe webhook secret not configured (Phase 7 placeholder).' },
      { status: env.NODE_ENV === 'production' ? 501 : 200 },
    );
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  return NextResponse.json(
    { received: true, note: 'Signature verification not implemented yet.' },
    { status: 200 },
  );
};
