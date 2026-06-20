'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';
import { BubbleModal } from '@/features/experience/components/BubbleModal';
import { requestInstantPayoutAction } from '@/features/payments/actions';
import { playSuccess } from '@/lib/sound/sound-manager';

type Props = {
  pendingCents: number;
  hasConnectAccount: boolean;
};

const fmtPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export const InstantPayoutButton = ({ pendingCents, hasConnectAccount }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const feeCents = Math.round(pendingCents * 0.05);
  const netCents = pendingCents - feeCents;

  const disabled = !hasConnectAccount || pendingCents <= 0 || isPending;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await requestInstantPayoutAction();
      if (result.ok) {
        playSuccess();
        setSuccess(true);
      } else {
        setError(result.error ?? 'Payout failed. Please try again.');
      }
    });
  };

  const closeModal = () => {
    setShowConfirm(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      <div className="rounded-xl border border-neutral-200 bg-white/90 p-5 shadow-tier1">
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
          onClick={() => {
            setSuccess(false);
            setError(null);
            setShowConfirm(true);
          }}
        >
          {isPending
            ? 'Processing…'
            : `Get paid now${pendingCents > 0 ? ` — ${fmtPrice(netCents)}` : ''}`}
        </Button>
      </div>

      <BubbleModal
        open={showConfirm}
        onClose={closeModal}
        title={success ? 'Payout initiated' : 'Confirm instant payout'}
        description={
          success
            ? 'Funds are on the way to your connected account.'
            : `You will receive ${fmtPrice(netCents)} after the 5% fee.`
        }
        footer={
          success ? (
            <Button className="w-full" onClick={closeModal}>
              Done
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={isPending}>
                {isPending ? 'Processing…' : 'Confirm payout'}
              </Button>
            </div>
          )
        }
      >
        {error && <TrustCallout variant="caution">{error}</TrustCallout>}
        {!success && !error && (
          <p className="text-sm text-neutral-600">
            Instant payouts typically arrive within minutes. This cannot be reversed once submitted.
          </p>
        )}
      </BubbleModal>
    </>
  );
};
