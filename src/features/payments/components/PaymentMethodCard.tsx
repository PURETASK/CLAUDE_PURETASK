'use client';

import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BubbleModal } from '@/features/experience/components/BubbleModal';
import {
  deletePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from '@/features/payments/actions';
import type { PaymentMethodRow } from '@/features/payments/queries';

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  diners: 'Diners Club',
};

type Props = { pm: PaymentMethodRow };

export const PaymentMethodCard = ({ pm }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const brand = CARD_BRAND_LABELS[pm.card_brand ?? ''] ?? pm.card_brand ?? 'Card';
  const expiry =
    pm.card_exp_month && pm.card_exp_year
      ? `${String(pm.card_exp_month).padStart(2, '0')}/${String(pm.card_exp_year).slice(-2)}`
      : null;

  const handleRemove = () => {
    startTransition(async () => {
      await deletePaymentMethodAction(pm.id);
      setShowRemoveConfirm(false);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-tier1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-14 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-600">
            {brand.slice(0, 4).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">
              {brand} ···· {pm.card_last_four}
            </p>
            {expiry && <p className="text-xs text-neutral-400">Expires {expiry}</p>}
          </div>
          {pm.is_default && <Badge variant="info">Default</Badge>}
        </div>

        <div className="flex items-center gap-2">
          {!pm.is_default && (
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await setDefaultPaymentMethodAction(pm.id);
                })
              }
              className="text-xs text-neutral-500 transition-colors duration-control hover:text-neutral-800 disabled:opacity-50"
            >
              Set default
            </button>
          )}
          <button
            disabled={isPending || pm.is_default}
            onClick={() => setShowRemoveConfirm(true)}
            className="text-xs text-error transition-colors duration-control hover:text-error-dark disabled:opacity-30"
            title={pm.is_default ? 'Cannot delete default card' : 'Remove card'}
          >
            Remove
          </button>
        </div>
      </div>

      <BubbleModal
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove this card?"
        description={`${brand} ending in ${pm.card_last_four} will be removed from your account.`}
        variant="alert"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowRemoveConfirm(false)}>
              Keep card
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:brightness-110"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          You will need another payment method on file before your next booking.
        </p>
      </BubbleModal>
    </>
  );
};
