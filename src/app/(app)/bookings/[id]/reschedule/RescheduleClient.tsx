'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { requestReschedule } from '@/features/booking/actions/lifecycle';
import { Button, TrustCallout } from '@/components/ui';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

interface Booking {
  id: string;
  start_at: string;
  cleaner_name: string;
}

interface Props {
  booking: Booking;
}

export const RescheduleClient = ({ booking }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [error, setError] = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0]!;

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0]!;

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time.');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await requestReschedule(booking.id, selectedDate, selectedTime);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/app/bookings/${booking.id}?rescheduled=1`);
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
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Reschedule</h1>
          <p className="mt-1 text-neutral-600">{booking.cleaner_name}</p>
        </div>

        <TrustCallout variant="info">
          The cleaner has 4 hours to confirm your new date. You&apos;ll be notified when they respond.
        </TrustCallout>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <label className="mb-2 block text-sm font-medium text-neutral-700">New date</label>
          <input
            type="date"
            value={selectedDate}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>

        {selectedDate && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <p className="mb-3 text-sm font-medium text-neutral-700">Preferred time</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => {
                const label = new Date(`2000-01-01T${t}`).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      selectedTime === t
                        ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Link
            href={`/app/bookings/${booking.id}`}
            className="flex flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isPending}
          >
            {isPending ? 'Sending request…' : 'Request reschedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};
