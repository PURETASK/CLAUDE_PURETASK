import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';

import { CancelButton } from './CancelButton';

type Props = { params: Promise<{ id: string }> };

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default async function CancelBookingPage({ params }: Props) {
  const { id } = await params;

  const [booking, customerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
  ]);
  if (!booking) notFound();
  if (booking.customer_id !== customerProfileId) notFound();
  if (!['booking_requested', 'confirmed'].includes(booking.state)) {
    redirect(`/app/bookings/${id}`);
  }

  const start = new Date(booking.start_at);
  const hoursUntil = (start.getTime() - Date.now()) / 3_600_000;
  const tier =
    hoursUntil >= 48
      ? { pct: 0, label: 'Free', tone: 'success' as const }
      : hoursUntil >= 24
        ? { pct: 50, label: '50% fee', tone: 'warning' as const }
        : { pct: 100, label: '100% fee', tone: 'error' as const };
  const feeCents = Math.round((booking.total_charge_cents * tier.pct) / 100);

  const toneClass = {
    success: 'border-success/30 bg-success-light text-success-dark',
    warning: 'border-warning/30 bg-warning-light text-warning-dark',
    error: 'border-error/30 bg-error-light text-error-dark',
  }[tier.tone];

  const whenLabel = `${start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  const relHours = Math.max(0, Math.round(hoursUntil));

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/bookings/${id}`}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to booking"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Cancel cleaning</h1>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Canceling</p>
        <p className="mt-1 text-sm font-semibold text-neutral-900">
          {booking.service_display_name} with {booking.other_party_name}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {whenLabel} · {relHours} hrs from now
        </p>
      </Card>

      <div className={`rounded-2xl border p-4 ${toneClass}`}>
        <p className="text-xs font-semibold uppercase tracking-wide">
          Cancellation fee: {tier.label}
        </p>
        <p className="mt-1 text-sm leading-relaxed">
          {tier.pct === 0
            ? "You're outside the fee window — this cancellation is free and fully refunded."
            : `Canceling ${
                tier.pct === 50 ? '24–48 hours' : 'less than 24 hours'
              } before charges ${tier.pct}% to compensate your cleaner's blocked time. You'll be charged ${fmtPrice(
                feeCents,
              )} of the ${fmtPrice(booking.total_charge_cents)} booking.`}
        </p>
      </div>

      {tier.pct > 0 && (
        <Card elevation={1} className="border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-900">Want to avoid the fee?</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            Reschedule instead — your cleaner just needs to confirm the new time.
          </p>
          <Link
            href={`/app/bookings/${id}/reschedule`}
            className="mt-3 inline-block rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Reschedule instead
          </Link>
        </Card>
      )}

      <CancelButton bookingId={id} feeCents={feeCents} />

      <Link
        href={`/app/bookings/${id}`}
        className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        Keep my booking
      </Link>
    </div>
  );
}
