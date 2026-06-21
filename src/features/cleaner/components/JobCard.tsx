'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { acceptBookingAction, declineBookingAction } from '@/features/booking/actions';

type Booking = {
  id: string;
  service_display_name: string;
  other_party_name: string;
  address_street: string;
  start_at: string;
  duration_hours_decimal: number;
  cleaner_payout_cents: number;
};

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
const fmtPrice = (c: number) => `$${(c / 100).toFixed(0)}`;

/** New-request card with Accept / Decline (cleaner side). */
export function JobCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (id: string) => Promise<{ ok: boolean; error: string | null }>) =>
    start(async () => {
      const res = await fn(booking.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Something went wrong.');
    });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">{booking.service_display_name}</p>
        <p className="flex-shrink-0 text-sm font-semibold text-neutral-900">
          {fmtPrice(booking.cleaner_payout_cents)}
        </p>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {fmtWhen(booking.start_at)} · {booking.duration_hours_decimal} hrs
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {booking.other_party_name} · {booking.address_street}
      </p>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(acceptBookingAction)}
          className="flex-1 rounded-lg bg-gradient-brand py-2 text-xs font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-60"
        >
          {pending ? '…' : 'Accept'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(declineBookingAction)}
          className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60"
        >
          Decline
        </button>
        <Link
          href={`/app/cleaner/bookings/${booking.id}`}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          View
        </Link>
      </div>
    </div>
  );
}
