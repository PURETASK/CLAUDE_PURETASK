'use server';

import { createExpressAccount, createExpressAccountLink } from '@/lib/stripe/connect';

export const createConnectOnboardingAction = async (
  email: string,
  returnUrl: string,
  refreshUrl: string,
) => {
  const account = await createExpressAccount(email);
  const link = await createExpressAccountLink(account.id, returnUrl, refreshUrl);

  return {
    ok: true as const,
    accountId: account.id,
    onboardingUrl: link.url,
  };
};
