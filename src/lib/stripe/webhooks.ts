import Stripe from 'stripe';

import { env } from '@/lib/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
});

export const constructStripeWebhookEvent = (payload: string, signature: string, secret: string) => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

export { stripe };
