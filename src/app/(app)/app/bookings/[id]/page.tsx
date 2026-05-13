import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ApproveWorkButton } from '@/features/booking/components/ApproveWorkButton';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { getReviewForBooking } from '@/features/reviews/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const CustomerBookingDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [booking, customerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
  ]);

  if (!booking) notFound();
  if (booking.customer_id !== customerProfileId) notFound();

  const existingReview = await getReviewForBooking(id);

  const start = new Date(booking.start_at);
  const cancellable = ['booking_requested', 'confirmed'].includes(booking.state);
  const trackable = ['confirmed', 'imminent', 'in_transit', 'arrived', 'in_progress'].includes(
    booking.state,
  );
  const awaitingApproval = booking.state === 'awaiting_approval';
  const reviewableStates = ['approved', 'auto_approved', 'paid', 'disputed', 'dispute_resolved'];
  const canReview = reviewableStates.includes(booking.state) && !existingReview;
  const canDispute =
    ['approved', 'auto_approved', 'paid'].includes(booking.state) ||
    booking.state === 'disputed' ||
    booking.state === 'dispute_resolved';

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/bookings" className="text-sm text-neutral-500 hover:text-neutral-900">
          My Bookings
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
            <span className="w-28 shrink-0 text-neutral-400">Cleaner</span>
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
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium">Pricing</p>
          {['approved', 'auto_approved', 'paid', 'disputed', 'dispute_resolved'].includes(
            booking.state,
          ) && (
            <Link
              href={`/app/bookings/${booking.id}/receipt`}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              View receipt →
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-neutral-600">
          <div className="flex justify-between">
            <span>
              {fmtPrice(booking.hourly_rate_cents)}/hr × {booking.duration_hours_decimal}hr
            </span>
            <span>{fmtPrice(booking.cleaner_subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>PureTask service fee</span>
            <span>{fmtPrice(booking.platform_fee_cents)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-900">
            <span>Total</span>
            <span>{fmtPrice(booking.total_charge_cents)}</span>
          </div>
        </div>
      </section>

      {trackable && (
        <Link
          href={`/app/bookings/${booking.id}/tracking`}
          className="flex items-center justify-between rounded-2xl bg-gradient-brand px-5 py-4 text-white shadow-tier1 transition-all hover:brightness-110"
        >
          <span className="font-semibold">Track your cleaner</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {booking.cleaner_id && booking.state !== 'cancelled' && (
        <Link
          href={`/app/bookings/${booking.id}/messages`}
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
      )}

      {awaitingApproval && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="mb-1 font-medium text-neutral-900">
            Your cleaner has marked this job complete.
          </p>
          <p className="mb-4 text-sm text-neutral-500">
            Review the work and approve or file a dispute within 24 hours.
          </p>
          <div className="flex flex-wrap gap-3">
            <ApproveWorkButton bookingId={booking.id} />
            <Link
              href={`/app/bookings/${booking.id}/dispute`}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
            >
              File a dispute
            </Link>
          </div>
        </div>
      )}

      {cancellable && (
        <div className="flex gap-3">
          <Link
            href={`/app/bookings/${booking.id}/reschedule`}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
          >
            Reschedule
          </Link>
          <Link
            href={`/app/bookings/${booking.id}/cancel`}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
          >
            Cancel booking
          </Link>
        </div>
      )}

      {['approved', 'auto_approved', 'paid', 'completed'].includes(booking.state) &&
        booking.cleaner_id && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-tier1">
            <p className="font-medium text-brand-900">
              Loved working with {booking.other_party_name}?
            </p>
            <p className="mt-1 text-sm text-brand-800">
              Book them again — they already know your home.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/app/cleaners/${booking.cleaner_id}/book`}
                className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
              >
                Book {booking.other_party_name} again
              </Link>
              <Link
                href="/app/recurring/new"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
              >
                Set up a recurring clean
              </Link>
            </div>
          </div>
        )}

      {(canReview || canDispute) && (
        <div className="flex flex-wrap gap-3">
          {canReview && (
            <Link
              href={`/app/bookings/${booking.id}/review`}
              className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
            >
              Leave a review
            </Link>
          )}
          {existingReview && (
            <span className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-600">
              <span className="text-brand-600">✓</span> Review submitted
            </span>
          )}
          {canDispute && (
            <Link
              href={`/app/bookings/${booking.id}/dispute`}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
            >
              {booking.state === 'disputed' || booking.state === 'dispute_resolved'
                ? 'View dispute'
                : 'File a dispute'}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerBookingDetailPage;
