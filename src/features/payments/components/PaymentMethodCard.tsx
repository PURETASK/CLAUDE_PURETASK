'use client';

import { useTransition } from 'react';

import {
  deletePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from '@/features/payments/actions';
import type { PaymentMethodRow } from '@/features/payments/queries';
import { Badge } from '@/components/ui/badge';

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

  const brand = CARD_BRAND_LABELS[pm.card_brand ?? ''] ?? pm.card_brand ?? 'Card';
  const expiry =
    pm.card_exp_month && pm.card_exp_year
      ? `${String(pm.card_exp_month).padStart(2, '0')}/${String(pm.card_exp_year).slice(-2)}`
      : null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-tier1">
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
          onClick={() =>
            startTransition(async () => {
              await deletePaymentMethodAction(pm.id);
            })
          }
          className="text-xs text-error transition-colors duration-control hover:text-error-dark disabled:opacity-30"
          title={pm.is_default ? 'Cannot delete default card' : 'Remove card'}
        >
          Remove
        </button>
      </div>
    </div>
  );
};
