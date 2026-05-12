'use client';

import { useRouter } from 'next/navigation';
import { useActionState } from 'react';

import { rescheduleBookingAction } from '@/features/booking/actions';

type Props = { bookingId: string; currentStartAt: string };

const INITIAL = { ok: false, error: null as string | null };

export function RescheduleForm({ bookingId, currentStartAt }: Props) {
  const router = useRouter();
  const actionWithId = rescheduleBookingAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(actionWithId, INITIAL);

  if (state.ok) {
    router.push(`/app/bookings/${bookingId}`);
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  const currentFormatted = new Date(currentStartAt).toISOString().slice(0, 16);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Current date &amp; time
        </label>
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
          {new Date(currentStartAt).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div>
        <label htmlFor="new_start_at" className="mb-1.5 block text-sm font-medium text-neutral-700">
          New date &amp; time
        </label>
        <input
          id="new_start_at"
          name="new_start_at"
          type="datetime-local"
          required
          min={minDateStr}
          defaultValue={currentFormatted}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? 'Requesting…' : 'Request reschedule'}
      </button>
    </form>
  );
}
