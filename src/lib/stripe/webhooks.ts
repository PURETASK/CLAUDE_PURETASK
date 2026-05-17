import Stripe from 'stripe';

import { env } from '@/lib/env';
import { INTEGRATION_MESSAGES } from '@/lib/integrations';

let stripeClient: Stripe | null = null;

export const isStripeConfigured = (): boolean => Boolean(env.STRIPE_SECRET_KEY);

export const getStripe = (): Stripe => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(INTEGRATION_MESSAGES.stripe);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' });
  }
  return stripeClient;
};

/**
 * Lazy Stripe client. Prefer `isStripeConfigured()` + `getStripe()` in server actions.
 * Property access throws a clear error when STRIPE_SECRET_KEY is unset.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

export const constructStripeWebhookEvent = (payload: string, signature: string, secret: string) => {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
};
