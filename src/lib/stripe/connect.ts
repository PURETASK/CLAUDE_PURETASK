import { getStripe } from '@/lib/stripe/webhooks';

export const createExpressAccount = async (email: string) => {
  return getStripe().accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
};

export const createExpressAccountLink = async (
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
) => {
  return getStripe().accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
};
