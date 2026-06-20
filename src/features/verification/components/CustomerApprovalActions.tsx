'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { approveBookingAction, disputeBookingAction } from '@/features/verification/actions';

type Props = { bookingId: string };

export const CustomerApprovalActions = ({ bookingId }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState('');

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveBookingAction(bookingId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const onDispute = () => {
    setError(null);
    startTransition(async () => {
      const res = await disputeBookingAction(bookingId, reason);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded border bg-white p-4 text-sm">
      <p className="font-medium">Review the cleaning</p>
      <p className="text-xs text-zinc-500">
        Approving releases the held payment to the cleaner. If something looks wrong, file a dispute
        and we&apos;ll review.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={onApprove}
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? 'Working…' : 'Approve & release payment'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowDispute((v) => !v)}
          className="rounded border px-5 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
        >
          File a dispute
        </button>
      </div>
      {showDispute && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What went wrong? (at least 10 characters)"
            rows={3}
            className="rounded border px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending || reason.trim().length < 10}
            onClick={onDispute}
            className="self-end rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
          >
            Submit dispute
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
