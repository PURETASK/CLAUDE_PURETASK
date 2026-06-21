'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';
import { rescheduleBookingAction } from '@/features/booking/actions';
import { cn } from '@/lib/utils/cn';

type DateOption = { value: string; dow: string; day: number; month: string };
type Props = { bookingId: string; currentStartAt: string; dateOptions: DateOption[] };

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];
const INITIAL = { ok: false, error: null as string | null };

const fmtTime = (hhmm: string) => {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  const am = h < 12;
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
};

export function RescheduleForm({ bookingId, currentStartAt, dateOptions }: Props) {
  const router = useRouter();
  const actionWithId = rescheduleBookingAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(actionWithId, INITIAL);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (state.ok) router.push(`/app/bookings/${bookingId}`);
  }, [state.ok, router, bookingId]);

  const newStartAt = date && time ? `${date}T${time}` : '';
  const current = new Date(currentStartAt);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="new_start_at" value={newStartAt} />

      <div className="rounded-xl bg-neutral-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Current booking
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          {current.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}{' '}
          · {current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500">New date</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dateOptions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={cn(
                'flex w-14 flex-shrink-0 flex-col items-center rounded-xl border py-2 transition-colors',
                date === d.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-medium',
                  date === d.value ? 'text-white/80' : 'text-neutral-400',
                )}
              >
                {d.dow}
              </span>
              <span className="text-base font-semibold">{d.day}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500">New time</p>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={cn(
                'rounded-lg border py-2 text-xs font-medium transition-colors',
                time === t
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
              )}
            >
              {fmtTime(t)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-neutral-400">
        Your cleaner will be notified and has 4 hours to accept. If they can&apos;t take the new
        time, your original booking stays in place.
      </p>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

      <Button type="submit" disabled={isPending || !newStartAt}>
        {isPending ? 'Requesting…' : 'Confirm reschedule'}
      </Button>
    </form>
  );
}
