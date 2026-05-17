'use server';

import { INTEGRATION_MESSAGES, isStripeConfigured } from '@/lib/integrations';
import { createExpressAccount, createExpressAccountLink } from '@/lib/stripe/connect';

export const createConnectOnboardingAction = async (
  email: string,
  returnUrl: string,
  refreshUrl: string,
) => {
  if (!isStripeConfigured()) {
    return { ok: false as const, error: INTEGRATION_MESSAGES.stripe };
  }

  const account = await createExpressAccount(email);
  const link = await createExpressAccountLink(account.id, returnUrl, refreshUrl);

  return {
    ok: true as const,
    accountId: account.id,
    onboardingUrl: link.url,
  };
};
