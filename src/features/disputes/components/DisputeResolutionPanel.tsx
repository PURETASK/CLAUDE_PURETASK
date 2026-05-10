'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';

type ResolutionChoice = 'admin_no_refund' | 'admin_partial_refund' | 'admin_refund';

interface Props {
  disputeId: string;
  bookingId: string;
  totalChargeCents: number;
  onResolve: (
    disputeId: string,
    resolution: ResolutionChoice,
    refundCents: number,
    rationale: string,
  ) => Promise<{ error: string | null }>;
}

export const DisputeResolutionPanel = ({
  disputeId,
  bookingId: _bookingId,
  totalChargeCents,
  onResolve,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState<ResolutionChoice>('admin_no_refund');
  const [rationale, setRationale] = useState('');
  const [error, setError] = useState('');

  const totalDollars = (totalChargeCents / 100).toFixed(2);
  const halfDollars = (totalChargeCents / 2 / 100).toFixed(2);

  const refundCents =
    resolution === 'admin_refund'
      ? totalChargeCents
      : resolution === 'admin_partial_refund'
        ? Math.round(totalChargeCents / 2)
        : 0;

  const handleSubmit = () => {
    if (!rationale.trim()) {
      setError('Rationale is required.');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await onResolve(disputeId, resolution, refundCents, rationale);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  const options: { value: ResolutionChoice; label: string; detail: string }[] = [
    {
      value: 'admin_no_refund',
      label: 'Cleaner stands by their work',
      detail: 'Release payment to cleaner',
    },
    {
      value: 'admin_partial_refund',
      label: `Partial refund (50%)`,
      detail: `$${halfDollars} returned to customer`,
    },
    {
      value: 'admin_refund',
      label: 'Full refund',
      detail: `$${totalDollars} returned to customer`,
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-5">
      <h3 className="font-semibold text-neutral-900">Your Decision</h3>

      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              resolution === opt.value
                ? 'border-brand-600/30 bg-brand-600/5'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <input
              type="radio"
              name="resolution"
              value={opt.value}
              checked={resolution === opt.value}
              onChange={() => setResolution(opt.value)}
              className="mt-0.5 h-4 w-4 border-neutral-300 text-brand-600 focus:ring-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
              <p className="text-xs text-neutral-500">{opt.detail}</p>
            </div>
          </label>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-900">
          Rationale <span className="text-error">*</span>
        </label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Explain your decision based on the photos and customer claim…"
          rows={4}
          className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Resolving…' : 'Resolve Dispute'}
      </Button>
    </div>
  );
};
