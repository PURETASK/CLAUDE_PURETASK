import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { CleanerActionButtons } from '@/features/booking/components/CleanerActionButtons';
import { getBookingById, getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const CleanerBookingDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [booking, cleanerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCleanerProfileId(),
  ]);

  if (!booking) notFound();
  if (booking.cleaner_id !== cleanerProfileId) notFound();

  const start = new Date(booking.start_at);
  const isRequested = booking.state === 'booking_requested';
  const hasDispute = booking.state === 'disputed';
  const enRouteStates = ['confirmed', 'imminent', 'in_transit', 'arrived'];
  const showStartJob = enRouteStates.includes(booking.state);
  const showActiveJob = booking.state === 'in_progress';
  const showAwaitingApproval = booking.state === 'awaiting_approval';
  const startJobLabel =
    booking.state === 'confirmed' || booking.state === 'imminent'
      ? "Start job — I'm on my way"
      : booking.state === 'arrived'
        ? 'Continue — you have arrived'
        : "Continue — you're on your way";

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/cleaner" className="text-sm text-neutral-500 hover:text-neutral-900">
          Dashboard
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">{booking.booking_number}</h1>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 text-sm">
        <div className="mb-4 flex items-center gap-3">
          <BookingStateBadge state={booking.state} />
          <span className="text-neutral-400">#{booking.booking_number}</span>
        </div>
        <div className="flex flex-col gap-2 text-neutral-600">
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-neutral-400">Service</span>
            <span>{booking.service_display_name}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-neutral-400">Customer</span>
            <span>{booking.other_party_name}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-neutral-400">Address</span>
            <span>{booking.address_street}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-neutral-400">Date</span>
            <span>
              {start.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-neutral-400">Time</span>
            <span>
              {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·{' '}
              {booking.duration_hours_decimal}hr
            </span>
          </div>
          {booking.customer_notes && (
            <div className="flex gap-4">
              <span className="w-28 shrink-0 text-neutral-400">Notes</span>
              <span className="whitespace-pre-wrap">{booking.customer_notes}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 text-sm">
        <p className="mb-3 font-semibold text-neutral-900">Your earnings</p>
        <div className="flex flex-col gap-1.5 text-neutral-600">
          <div className="flex justify-between">
            <span>
              {fmtPrice(booking.hourly_rate_cents)}/hr × {booking.duration_hours_decimal}hr
            </span>
            <span>{fmtPrice(booking.cleaner_subtotal_cents)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-900">
            <span>Your payout</span>
            <span>{fmtPrice(booking.cleaner_payout_cents)}</span>
          </div>
        </div>
      </section>

      <Link
        href={`/app/cleaner/bookings/${booking.id}/messages`}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-tier1 transition-all hover:bg-neutral-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Message {booking.other_party_name}
      </Link>

      {isRequested && <CleanerActionButtons bookingId={booking.id} />}
      {showStartJob && (
        <Link href={`/cleaner/jobs/${booking.id}/on-my-way`}>
          <Button className="w-full" size="lg">
            {startJobLabel}
          </Button>
        </Link>
      )}
      {showActiveJob && (
        <Link href={`/cleaner/jobs/${booking.id}/active`}>
          <Button className="w-full" size="lg">
            Continue active job
          </Button>
        </Link>
      )}
      {showAwaitingApproval && (
        <Link
          href={`/cleaner/jobs/${booking.id}/complete`}
          className="inline-block rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          View submitted job · awaiting customer approval
        </Link>
      )}
      {hasDispute && (
        <Link
          href={`/app/cleaner/bookings/${booking.id}/dispute`}
          className="inline-block rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          View dispute
        </Link>
      )}
    </div>
  );
};

export default CleanerBookingDetailPage;
