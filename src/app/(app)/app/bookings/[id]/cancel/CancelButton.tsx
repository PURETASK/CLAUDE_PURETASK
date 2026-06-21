'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cancelBookingAction } from '@/features/booking/actions';

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function CancelButton({ bookingId, feeCents }: { bookingId: string; feeCents: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const doCancel = () =>
    start(async () => {
      const res = await cancelBookingAction(bookingId);
      if (res.ok) router.push(`/app/bookings/${bookingId}`);
      else setError(res.error ?? 'Could not cancel the booking.');
    });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl bg-error px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:brightness-110"
      >
        {feeCents > 0 ? `Cancel and pay ${fmtPrice(feeCents)} fee` : 'Cancel booking'}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-error/30 bg-error-light p-4">
      <p className="text-sm font-medium text-error-dark">
        This can&apos;t be undone. Confirm cancellation?
      </p>
      {error && <p className="mt-2 text-xs text-error-dark">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Go back
        </button>
        <button
          type="button"
          onClick={doCancel}
          disabled={pending}
          className="flex-1 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
        >
          {pending ? 'Cancelling…' : 'Yes, cancel'}
        </button>
      </div>
    </div>
  );
}
