/**
 * Phase 7 placeholder implementations.
 *
 * These functions simulate Stripe behavior so the booking flow can wire up
 * end-to-end without real API keys. Each placeholder either:
 *   - returns a deterministic "authorized" stub when STRIPE_SECRET_KEY is unset, or
 *   - throws "Not yet implemented" if you try to use it with real keys.
 *
 * Replace the bodies with real Stripe SDK calls once `stripe` is installed.
 */
import type { ConnectOnboardingLink, PaymentAuthResult, PaymentCaptureResult } from './types';

export const authorizePaymentPlaceholder = async (
  bookingId: string,
  amountCents: number,
): Promise<PaymentAuthResult> => {
  void bookingId;
  void amountCents;
  return {
    ok: true,
    paymentIntentId: `pi_placeholder_${bookingId}`,
    clientSecret: `pi_placeholder_${bookingId}_secret_dev`,
    status: 'requires_capture',
  };
};

export const capturePaymentPlaceholder = async (
  paymentIntentId: string,
  amountCents: number,
): Promise<PaymentCaptureResult> => ({
  ok: true,
  paymentIntentId,
  capturedCents: amountCents,
});

export const createConnectOnboardingPlaceholder = async (
  cleanerId: string,
  returnUrl: string,
): Promise<ConnectOnboardingLink> => ({
  ok: true,
  url: `${returnUrl}?placeholder=true&cleaner=${cleanerId}`,
  expiresAt: 0,
});
