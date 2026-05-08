import Stripe from 'stripe';

import { env } from '@/lib/env';

function makeStripe(): Stripe {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    return new Proxy({} as Stripe, {
      get() {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      },
    });
  }
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

export const stripe: Stripe = makeStripe();

export const constructStripeWebhookEvent = (payload: string, signature: string, secret: string) => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};
