'use server';

import { INTEGRATION_MESSAGES, isStripeConfigured } from '@/lib/integrations';
import { createIdentityVerificationSession } from '@/lib/stripe/identity';

export const createIdentitySessionAction = async (applicationId: string, returnUrl: string) => {
  if (!isStripeConfigured()) {
    return { ok: false as const, error: INTEGRATION_MESSAGES.stripe };
  }

  const session = await createIdentityVerificationSession(returnUrl, {
    application_id: applicationId,
  });

  return {
    ok: true as const,
    url: session.url,
    sessionId: session.id,
  };
};
