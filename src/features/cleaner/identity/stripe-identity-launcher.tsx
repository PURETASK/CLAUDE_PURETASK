'use client';

import { useTransition } from 'react';

import { createIdentitySessionAction } from '@/features/cleaner/identity/actions';
import { Button } from '@/components/ui/button';

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
    <Button type="button" onClick={handleLaunch} disabled={isPending}>
      {isPending ? 'Launching…' : 'Launch Stripe Identity'}
    </Button>
  );
};
