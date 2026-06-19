/**
 * Stripe SDK accessor — lazy, optional.
 *
 * Phase 7 is scaffolded against an unset STRIPE_SECRET_KEY. This file does NOT
 * import `stripe` (the package is not yet installed). Once keys are available:
 *
 *   1. `pnpm add stripe`
 *   2. Replace the stub `import type` with the real Stripe import.
 *   3. Set STRIPE_SECRET_KEY in .env.local (and Vercel).
 *
 * Code that uses Stripe should always go through `getStripe()` so that an
 * unconfigured environment fails loudly with a clear message instead of an
 * obscure import-time error.
 */
import { env } from '@/lib/env';

export type StripeStub = {
  /** Replace with `import Stripe from 'stripe'` once the package is installed. */
  __unconfigured: true;
};

let cached: StripeStub | null = null;

export const isStripeConfigured = (): boolean => Boolean(env.STRIPE_SECRET_KEY);

export const getStripe = (): StripeStub => {
  if (!isStripeConfigured()) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local and install the `stripe` package.',
    );
  }
  if (!cached) {
    cached = { __unconfigured: true };
  }
  return cached;
};
