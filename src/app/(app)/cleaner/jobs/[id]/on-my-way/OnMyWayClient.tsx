'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { markArrived, markEnRoute, markRunningLate } from '@/features/booking/actions/job-flow';
import { Button } from '@/components/ui';

const DELAY_OPTIONS = [5, 10, 15, 20, 30] as const;
const LATE_REASONS = [
  'Traffic delay',
  'Previous job ran long',
  'Car issue',
  'Navigation issue',
  'Other',
];

interface Booking {
  id: string;
  state: string;
  start_at: string;
  is_running_late: boolean;
  late_estimate_minutes: number | null;
  address: { street_1: string; city: string; state: string; zip_code: string } | null;
  customer_name: string;
}

interface Props {
  booking: Booking;
}

export const OnMyWayClient = ({ booking }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLateModal, setShowLateModal] = useState(false);
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState('');

  const address = booking.address
    ? `${booking.address.street_1}, ${booking.address.city}, ${booking.address.state} ${booking.address.zip_code}`
    : '';

  const scheduledTime = new Date(booking.start_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isEnRoute = booking.state === 'in_transit';
  const isArrived = booking.state === 'arrived';

  const handleOnMyWay = () => {
    startTransition(async () => {
      await markEnRoute(booking.id);
      router.refresh();
    });
  };

  const handleArrived = () => {
    startTransition(async () => {
      await markArrived(booking.id);
      router.push(`/cleaner/jobs/${booking.id}/active`);
    });
  };

  const handleLateSubmit = () => {
    if (!selectedDelay) return;
    startTransition(async () => {
      await markRunningLate(booking.id, selectedDelay, selectedReason || undefined);
      setShowLateModal(false);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-sm font-medium text-neutral-500">Job for</p>
          <h1 className="text-2xl font-bold text-neutral-900">{booking.customer_name}</h1>
          <p className="mt-1 text-sm text-neutral-600">Scheduled {scheduledTime}</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Address</p>
          <p className="mt-1 font-semibold text-neutral-900">{address}</p>
          {address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              Open in Maps
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {booking.is_running_late && (
          <div className="rounded-xl border border-warning bg-warning-light px-4 py-3">
            <p className="text-sm font-semibold text-warning-dark">Running late notification sent</p>
            {booking.late_estimate_minutes && (
              <p className="mt-0.5 text-xs text-warning-dark/80">
                Customer notified of ~{booking.late_estimate_minutes} min delay.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {!isEnRoute && !isArrived ? (
            <Button className="w-full" size="lg" onClick={handleOnMyWay} disabled={isPending}>
              {isPending ? 'Sending…' : "I'm on my way"}
            </Button>
          ) : isArrived ? (
            <div className="rounded-xl border border-success bg-success-light px-4 py-3 text-center">
              <p className="text-sm font-semibold text-success">You've arrived ✓</p>
              <p className="mt-1 text-xs text-neutral-500">Head to the Active Job screen to clock in.</p>
            </div>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={handleArrived} disabled={isPending}>
                {isPending ? 'Updating…' : "I've arrived"}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={() => setShowLateModal(true)}
                disabled={isPending}
              >
                Running late?
              </Button>
            </>
          )}
        </div>
      </div>

      {showLateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-2xl">
            <h2 className="text-lg font-bold text-neutral-900">How late will you be?</h2>
            <p className="mt-1 text-sm text-neutral-500">The customer will be notified.</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {DELAY_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setSelectedDelay(min)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                    selectedDelay === min
                      ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {LATE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedReason === reason
                      ? 'border-neutral-700 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowLateModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleLateSubmit}
                disabled={!selectedDelay || isPending}
              >
                {isPending ? 'Sending…' : 'Send notice'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
