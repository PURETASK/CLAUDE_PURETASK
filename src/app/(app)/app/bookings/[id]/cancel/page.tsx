'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useTransition } from 'react';

import { cancelBookingAction } from '@/features/booking/actions';

type Props = { params: Promise<{ id: string }> };

function calcCancellationFee(
  startAt: Date,
  totalCents: number,
): { pct: number; feeCents: number; label: string } {
  const hoursUntil = (startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil > 48) return { pct: 0, feeCents: 0, label: 'Free — more than 48 hours away' };
  if (hoursUntil > 24)
    return {
      pct: 50,
      feeCents: Math.round(totalCents * 0.5),
      label: '50% cancellation fee (24–48 hours notice)',
    };
  return {
    pct: 100,
    feeCents: totalCents,
    label: '100% cancellation fee (less than 24 hours notice)',
  };
}

export default function CancelBookingPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBookingAction(id);
      if (result.ok) {
        router.push(`/app/bookings/${id}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-lg py-10">
      <Link
        href={`/app/bookings/${id}`}
        className="mb-6 block text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to booking
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier1">
        <h1 className="text-xl font-bold text-neutral-900">Cancel this booking?</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This action cannot be undone. Review the cancellation policy before confirming.
        </p>

        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Cancellation policy</h2>
          <div className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">More than 48 hours before</span>
              <span className="font-semibold text-green-700">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">24–48 hours before</span>
              <span className="font-semibold text-amber-600">50% fee</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Less than 24 hours</span>
              <span className="font-semibold text-red-600">100% fee</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/app/bookings/${id}`}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
          >
            Keep booking
          </Link>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
