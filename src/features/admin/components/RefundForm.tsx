'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';

type RefundType = 'full' | 'half' | 'goodwill';

interface Props {
  bookingId: string;
  bookingNumber: string;
  totalChargeCents: number;
  alreadyRefundedCents: number;
  chargeId: string;
  onRefund: (
    chargeId: string,
    bookingId: string,
    amountCents: number,
    reasonNotes: string,
  ) => Promise<{ error: string | null }>;
}

export const RefundForm = ({
  bookingId: _bookingId,
  bookingNumber,
  totalChargeCents,
  alreadyRefundedCents,
  chargeId,
  onRefund,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const maxRefundable = totalChargeCents - alreadyRefundedCents;
  const halfCents = Math.round(maxRefundable / 2);

  const refundCents =
    refundType === 'full' ? maxRefundable : refundType === 'half' ? halfCents : 0;

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const options: { value: RefundType; label: string; amount: string }[] = [
    { value: 'full', label: 'Full refund', amount: fmt(maxRefundable) },
    { value: 'half', label: 'Partial — 50%', amount: fmt(halfCents) },
    { value: 'goodwill', label: 'Goodwill credit (no charge)', amount: '$0.00' },
  ];

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await onRefund(chargeId, _bookingId, refundCents, reason);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-5">
      <div>
        <h2 className="font-semibold text-neutral-900">Process Refund</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Booking #{bookingNumber}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Booking total</span>
          <span className="font-medium">{fmt(totalChargeCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Already refunded</span>
          <span className="font-medium text-error">{fmt(alreadyRefundedCents)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-100 pt-2">
          <span className="font-medium text-neutral-900">Max refundable</span>
          <span className="font-bold text-neutral-900">{fmt(maxRefundable)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-900">Refund type</p>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 ${
              refundType === opt.value
                ? 'border-brand-600/30 bg-brand-600/5'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="refund_type"
                value={opt.value}
                checked={refundType === opt.value}
                onChange={() => setRefundType(opt.value)}
                className="h-4 w-4 border-neutral-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm text-neutral-900">{opt.label}</span>
            </div>
            <span className="text-sm font-semibold text-neutral-700">{opt.amount}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">
          Reason <span className="text-error">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Quality issue, cleaner no-show, etc."
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
      </div>

      <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 space-y-1">
        <p className="font-medium text-neutral-700">Who gets notified:</p>
        <p>✓ Customer — refund receipt</p>
        <p>✓ Cleaner — payout adjustment notification</p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button className="w-full" onClick={handleSubmit} disabled={isPending || maxRefundable <= 0}>
        {isPending ? 'Processing…' : 'Process Refund'}
      </Button>
    </div>
  );
};
