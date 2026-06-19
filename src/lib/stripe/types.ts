export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export type PaymentAuthResult =
  | { ok: true; paymentIntentId: string; clientSecret: string; status: PaymentIntentStatus }
  | { ok: false; error: string };

export type PaymentCaptureResult =
  | { ok: true; paymentIntentId: string; capturedCents: number }
  | { ok: false; error: string };

export type ConnectOnboardingLink =
  | { ok: true; url: string; expiresAt: number }
  | { ok: false; error: string };
