'use client';

import { useTransition } from 'react';

import { requestInstantPayoutAction } from '@/features/payments/actions';

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
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="mb-1 text-sm font-medium">Instant payout</p>
      <p className="mb-4 text-xs text-zinc-500">
        Receive your earnings immediately for a 5% fee. Normal payouts are free every Friday.
      </p>

      {pendingCents > 0 && (
        <div className="mb-4 space-y-1 text-sm text-zinc-600">
          <div className="flex justify-between">
            <span>Pending earnings</span>
            <span>{fmtPrice(pendingCents)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Instant payout fee (5%)</span>
            <span>−{fmtPrice(feeCents)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium text-zinc-900">
            <span>You receive</span>
            <span>{fmtPrice(netCents)}</span>
          </div>
        </div>
      )}

      {!hasConnectAccount && (
        <p className="mb-3 text-xs text-amber-600">
          Complete Stripe Connect setup to enable payouts.
        </p>
      )}

      <button
        disabled={disabled}
        onClick={() =>
          startTransition(async () => {
            await requestInstantPayoutAction();
          })
        }
        className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
      >
        {isPending
          ? 'Processing…'
          : `Get paid now${pendingCents > 0 ? ` — ${fmtPrice(netCents)}` : ''}`}
      </button>
    </div>
  );
};
