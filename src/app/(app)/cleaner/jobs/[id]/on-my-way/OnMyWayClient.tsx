'use client';

import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { markArrived, markEnRoute, markRunningLate } from '@/features/booking/actions/job-flow';
import { cn } from '@/lib/utils/cn';

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

export const OnMyWayClient = ({ booking }: { booking: Booking }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLate, setShowLate] = useState(false);
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

  const handleOnMyWay = () =>
    startTransition(async () => {
      await markEnRoute(booking.id);
      router.refresh();
    });

  const handleArrived = () =>
    startTransition(async () => {
      await markArrived(booking.id);
      router.push(`/cleaner/jobs/${booking.id}/active`);
    });

  const handleLateSubmit = () => {
    if (!selectedDelay) return;
    startTransition(async () => {
      await markRunningLate(booking.id, selectedDelay, selectedReason || undefined);
      setShowLate(false);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <p className="text-sm font-medium text-neutral-500">Job for</p>
        <h1 className="text-2xl font-bold text-neutral-900">{booking.customer_name}</h1>
        <p className="mt-1 text-sm text-neutral-600">Scheduled {scheduledTime}</p>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Address</p>
        <p className="mt-1 font-semibold text-neutral-900">{address}</p>
        {address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Open in Maps
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
          </a>
        )}
      </Card>

      {booking.is_running_late && (
        <Card elevation={1} className="border border-warning/30 bg-warning-light p-4">
          <p className="text-sm font-semibold text-warning-dark">Running-late notice sent</p>
          {booking.late_estimate_minutes && (
            <p className="mt-0.5 text-xs text-warning-dark/80">
              Customer notified of ~{booking.late_estimate_minutes} min delay.
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {!isEnRoute && !isArrived ? (
          <Button className="w-full" size="lg" onClick={handleOnMyWay} disabled={isPending}>
            {isPending ? 'Sending…' : "I'm on my way"}
          </Button>
        ) : isArrived ? (
          <Card elevation={1} className="border border-success/30 bg-success-light p-4 text-center">
            <p className="text-sm font-semibold text-success-dark">You&apos;ve arrived ✓</p>
            <p className="mt-1 text-xs text-neutral-500">
              Head to the active job screen to clock in.
            </p>
          </Card>
        ) : (
          <>
            <Button className="w-full" size="lg" onClick={handleArrived} disabled={isPending}>
              {isPending ? 'Updating…' : "I've arrived"}
            </Button>
            {!showLate ? (
              <Button
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={() => setShowLate(true)}
                disabled={isPending}
              >
                Running late?
              </Button>
            ) : (
              <Card elevation={1} className="border border-neutral-200 p-4">
                <p className="text-sm font-medium text-neutral-900">How late will you be?</p>
                <p className="mt-0.5 text-xs text-neutral-500">The customer will be notified.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DELAY_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setSelectedDelay(min)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        selectedDelay === min
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50',
                      )}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LATE_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        selectedReason === reason
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowLate(false)}
                    disabled={isPending}
                  >
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
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
