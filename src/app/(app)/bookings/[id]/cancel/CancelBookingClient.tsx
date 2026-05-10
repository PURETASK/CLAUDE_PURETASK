'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { cancelBooking } from '@/features/booking/actions/lifecycle';
import { Button, TrustCallout } from '@/components/ui';
import type { CancellationResult } from '@/features/booking/lib/cancellation-policy';

interface Booking {
  id: string;
  start_at: string;
  total_charge_cents: number;
  cleaner_name: string;
}

interface Props {
  booking: Booking;
  penalty: CancellationResult;
}

const CANCEL_REASONS = [
  'Schedule conflict',
  'Found another cleaner',
  'Need to reschedule',
  'Emergency came up',
  'Other',
];

export const CancelBookingClient = ({ booking, penalty }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const formattedDate = new Date(booking.start_at).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const totalDollars = (booking.total_charge_cents / 100).toFixed(2);
  const refundDollars = (penalty.refundCents / 100).toFixed(2);
  const penaltyDollars = (penalty.penaltyCents / 100).toFixed(2);

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBooking(booking.id, reason);
      if (!result.error) {
        router.push('/app/bookings?cancelled=1');
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href={`/app/bookings/${booking.id}`} className="text-sm text-brand-600 hover:underline">
            ← Back
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Cancel booking</h1>
          <p className="mt-1 text-neutral-600">
            {booking.cleaner_name} · {formattedDate}
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <div className="flex justify-between">
            <span className="text-sm text-neutral-500">Original charge</span>
            <span className="font-semibold text-neutral-900">${totalDollars}</span>
          </div>
          {penalty.penaltyCents > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-error">Cancellation fee</span>
              <span className="font-semibold text-error">−${penaltyDollars}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-100 pt-3">
            <span className="font-medium text-neutral-900">You will receive</span>
            <span className="text-lg font-bold text-success">${refundDollars}</span>
          </div>
        </div>

        {penalty.tier !== 'free' && (
          <TrustCallout variant="warning">
            {penalty.tier === 'full'
              ? 'Less than 24 hours notice: no refund applies per our cancellation policy.'
              : 'Less than 48 hours notice: 50% cancellation fee applies.'}
          </TrustCallout>
        )}

        <div>
          <p className="mb-3 text-sm font-medium text-neutral-700">Reason for cancelling</p>
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  reason === r
                    ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
          />
          <span className="text-sm text-neutral-700">
            I understand the cancellation policy and confirm I want to cancel this booking.
          </span>
        </label>

        <div className="flex gap-3">
          <Link
            href={`/app/bookings/${booking.id}`}
            className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Keep booking
          </Link>
          <Button
            variant="secondary"
            className="flex-1 border-error text-error hover:bg-error/5"
            onClick={handleCancel}
            disabled={!confirmed || isPending}
          >
            {isPending ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        </div>
      </div>
    </div>
  );
};
