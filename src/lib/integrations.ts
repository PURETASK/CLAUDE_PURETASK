import { env } from '@/lib/env';

/** User-facing copy when an integration is not configured (secrets added later). */
export const INTEGRATION_MESSAGES = {
  stripe:
    'Payments are not enabled on this server yet. Add Stripe keys when you are ready (see docs/secrets-when-ready.md).',
  stripePublishable:
    'Card entry is not available yet. Add STRIPE_PUBLISHABLE_KEY when Stripe is configured.',
  checkr:
    'Background checks are not enabled yet. Add Checkr keys when you are ready (see docs/secrets-when-ready.md).',
  taxEncryption:
    'Tax ID storage is not configured yet. Add TAX_ENCRYPTION_KEY when you are ready (see docs/secrets-when-ready.md).',
  googleMaps:
    'Address geocoding is off until GOOGLE_MAPS_API_KEY is set. Browse may use limited distance sorting.',
  cron: 'Scheduled jobs are off until CRON_SECRET is set and crons are registered in Vercel.',
} as const;

export type IntegrationId =
  | 'supabase'
  | 'stripe'
  | 'checkr'
  | 'google_maps'
  | 'resend'
  | 'web_push'
  | 'twilio'
  | 'cron'
  | 'tax_encryption';

export type IntegrationStatus = {
  id: IntegrationId;
  label: string;
  configured: boolean;
  requiredToBoot: boolean;
  requiredForV1E2E: boolean;
  enables: string;
};

export const isStripeConfigured = (): boolean => Boolean(env.STRIPE_SECRET_KEY);

export const isStripePublishableConfigured = (): boolean => Boolean(env.STRIPE_PUBLISHABLE_KEY);

export const isCheckrConfigured = (): boolean => Boolean(env.CHECKR_API_KEY);

export const isCheckrWebhookConfigured = (): boolean => Boolean(env.CHECKR_WEBHOOK_SECRET);

export const isGoogleMapsConfigured = (): boolean => Boolean(env.GOOGLE_MAPS_API_KEY);

export const isResendConfigured = (): boolean => Boolean(env.RESEND_API_KEY);

export const isWebPushConfigured = (): boolean =>
  Boolean(env.VAPID_PRIVATE_KEY && env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_EMAIL);

export const isTwilioConfigured = (): boolean =>
  Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_PHONE);

export const isCronConfigured = (): boolean => Boolean(env.CRON_SECRET);

export const isTaxEncryptionConfigured = (): boolean => Boolean(env.TAX_ENCRYPTION_KEY);

const isSupabaseConfigured = (): boolean =>
  Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

/** Full status table for scripts, dev banner, and settings UI. */
export const getIntegrationStatuses = (): IntegrationStatus[] => [
  {
    id: 'supabase',
    label: 'Supabase (auth + database)',
    configured: isSupabaseConfigured(),
    requiredToBoot: true,
    requiredForV1E2E: true,
    enables: 'Sign-in, profiles, bookings, RLS',
  },
  {
    id: 'stripe',
    label: 'Stripe (payments + Connect + Identity)',
    configured: isStripeConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: true,
    enables: 'Bookings, cards, payouts, identity verification',
  },
  {
    id: 'checkr',
    label: 'Checkr (background checks)',
    configured: isCheckrConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: true,
    enables: 'Cleaner application background check',
  },
  {
    id: 'google_maps',
    label: 'Google Maps (geocoding)',
    configured: isGoogleMapsConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: false,
    enables: 'Address geocoding and distance browse',
  },
  {
    id: 'resend',
    label: 'Resend (email)',
    configured: isResendConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: false,
    enables: 'Transactional email (skipped silently if off)',
  },
  {
    id: 'web_push',
    label: 'Web Push (VAPID)',
    configured: isWebPushConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: false,
    enables: 'Browser push notifications',
  },
  {
    id: 'twilio',
    label: 'Twilio (SMS)',
    configured: isTwilioConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: false,
    enables: 'SMS notifications',
  },
  {
    id: 'cron',
    label: 'Cron secret',
    configured: isCronConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: true,
    enables: 'Auto-approve, weekly payout, reliability jobs',
  },
  {
    id: 'tax_encryption',
    label: 'Tax ID encryption key',
    configured: isTaxEncryptionConfigured(),
    requiredToBoot: false,
    requiredForV1E2E: true,
    enables: 'Cleaner W-9 / SSN storage',
  },
];

/** Optional integrations missing — for dev-only UI hints. */
export const getOptionalIntegrationsMissing = (): IntegrationStatus[] =>
  getIntegrationStatuses().filter((s) => !s.requiredToBoot && !s.configured);

export const isV1E2EReady = (): boolean =>
  getIntegrationStatuses()
    .filter((s) => s.requiredForV1E2E)
    .every((s) => s.configured);
