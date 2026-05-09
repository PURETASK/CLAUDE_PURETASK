'use client';

import { useTransition } from 'react';

import { requestInstantPayoutAction } from '@/features/payments/actions';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

type Props = {
  pendingCents: number;
  hasConnectAccount: boolean;
};

const fmtPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export const InstantPayoutButton = ({ pendingCents, hasConnectAccount }: Props) => {
  const [isPending, startTransition] = useTransition();

  const feeCents = Math.round(pendingCents * 0.05);
  const netCents = pendingCents - feeCents;

  const disabled = !hasConnectAccount || pendingCents <= 0 || isPending;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <p className="mb-1 text-sm font-medium text-neutral-900">Instant payout</p>
      <p className="mb-4 text-xs text-neutral-500">
        Receive your earnings immediately for a 5% fee. Normal payouts are free every Friday.
      </p>

      {pendingCents > 0 && (
        <div className="mb-4 space-y-1 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>Pending earnings</span>
            <span>{fmtPrice(pendingCents)}</span>
          </div>
          <div className="flex justify-between text-error">
            <span>Instant payout fee (5%)</span>
            <span>−{fmtPrice(feeCents)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-100 pt-1 font-medium text-neutral-900">
            <span>You receive</span>
            <span>{fmtPrice(netCents)}</span>
          </div>
        </div>
      )}

      {!hasConnectAccount && (
        <TrustCallout variant="warning" className="mb-3">
          Complete Stripe Connect setup to enable payouts.
        </TrustCallout>
      )}

      <Button
        disabled={disabled}
        className="w-full"
        onClick={() =>
          startTransition(async () => {
            await requestInstantPayoutAction();
          })
        }
      >
        {isPending
          ? 'Processing…'
          : `Get paid now${pendingCents > 0 ? ` — ${fmtPrice(netCents)}` : ''}`}
      </Button>
    </div>
  );
};
