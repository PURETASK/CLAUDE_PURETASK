'use client';

import { useTransition } from 'react';

import { createIdentitySessionAction } from '@/features/cleaner/identity/actions';

export const StripeIdentityLauncher = ({
  applicationId,
  returnUrl,
}: {
  applicationId: string;
  returnUrl: string;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      const result = await createIdentitySessionAction(applicationId, returnUrl);
      if (result.ok && result.url) {
        window.location.href = result.url;
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLaunch}
      disabled={isPending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {isPending ? 'Launching...' : 'Launch Stripe Identity'}
    </button>
  );
};
