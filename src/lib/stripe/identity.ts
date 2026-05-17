import { getStripe } from '@/lib/stripe/webhooks';

export const createIdentityVerificationSession = async (
  returnUrl: string,
  metadata: Record<string, string>,
) => {
  return getStripe().identity.verificationSessions.create({
    type: 'document',
    return_url: returnUrl,
    metadata,
  });
};
