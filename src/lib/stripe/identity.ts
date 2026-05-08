import { stripe } from '@/lib/stripe/webhooks';

export const createIdentityVerificationSession = async (
  returnUrl: string,
  metadata: Record<string, string>,
) => {
  return stripe.identity.verificationSessions.create({
    type: 'document',
    return_url: returnUrl,
    metadata,
  });
};
