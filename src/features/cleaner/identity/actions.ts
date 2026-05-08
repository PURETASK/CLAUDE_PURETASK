'use server';

import { createIdentityVerificationSession } from '@/lib/stripe/identity';

export const createIdentitySessionAction = async (applicationId: string, returnUrl: string) => {
  const session = await createIdentityVerificationSession(returnUrl, {
    application_id: applicationId,
  });

  return {
    ok: true as const,
    url: session.url,
    sessionId: session.id,
  };
};
