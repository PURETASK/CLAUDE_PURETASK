'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ApproveWorkButton } from '@/features/booking/components/ApproveWorkButton';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { BubbleTabs, type BubbleTab } from '@/features/experience/components/BubbleTabs';

export type BookingDetailData = {
  id: string;
  booking_number: string;
  state: string;
  service_display_name: string;
  other_party_name: string;
  address_street: string;
  start_at: string;
  duration_hours_decimal: number;
  customer_notes: string | null;
  hourly_rate_cents: number;
  cleaner_subtotal_cents: number;
  platform_fee_cents: number;
  total_charge_cents: number;
  cleaner_id: string | null;
};

type Props = {
  booking: BookingDetailData;
  hasReview: boolean;
  trackable: boolean;
  cancellable: boolean;
  awaitingApproval: boolean;
  canReview: boolean;
  canDispute: boolean;
};

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const BookingDetailTabs = ({
  booking,
  hasReview,
  trackable,
  cancellable,
  awaitingApproval,
  canReview,
  canDispute,
}: Props) => {
  const [activeId, setActiveId] = useState('overview');

  const showReceipt = [
    'approved',
    'auto_approved',
    'paid',
    'disputed',
    'dispute_resolved',
  ].includes(booking.state);
  const showRebook = ['approved', 'auto_approved', 'paid', 'completed'].includes(booking.state);

  const tabs: BubbleTab[] = useMemo(() => {
    const start = new Date(booking.start_at);
    return [
      {
        id: 'overview',
        label: 'Overview',
        panel: (
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-neutral-200 bg-white/90 p-5 text-sm shadow-tier1">
              <div className="mb-4 flex items-center gap-3">
                <BookingStateBadge state={booking.state} />
                <span className="text-neutral-400">#{booking.booking_number}</span>
              </div>
              <dl className="flex flex-col gap-2 text-neutral-600">
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-neutral-400">Service</dt>
                  <dd>{booking.service_display_name}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-neutral-400">Cleaner</dt>
                  <dd>{booking.other_party_name}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-neutral-400">Address</dt>
                  <dd>{booking.address_street}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-neutral-400">Date</dt>
                  <dd>
                    {start.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-28 shrink-0 text-neutral-400">Time</dt>
                  <dd>
                    {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·{' '}
                    {booking.duration_hours_decimal}hr
                  </dd>
                </div>
                {booking.customer_notes ? (
                  <div className="flex gap-4">
                    <dt className="w-28 shrink-0 text-neutral-400">Notes</dt>
                    <dd className="whitespace-pre-wrap">{booking.customer_notes}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white/90 p-5 text-sm shadow-tier1">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">Pricing</p>
                {showReceipt && (
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
          </div>
        ),
      },
      {
        id: 'connect',
        label: 'Connect',
        panel: (
          <div className="flex flex-col gap-4">
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
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/90 px-4 py-3 text-sm font-medium text-neutral-600 shadow-tier1 transition-all hover:bg-neutral-50"
              >
                Message {booking.other_party_name}
              </Link>
            )}
            {!trackable && !booking.cleaner_id && (
              <p className="text-sm text-neutral-500">
                Live tracking and messaging unlock once a cleaner is assigned.
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        label: 'Actions',
        panel: (
          <div className="flex flex-col gap-4">
            {awaitingApproval && (
              <div className="rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-tier1">
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
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/app/bookings/${booking.id}/reschedule`}
                  className="rounded-xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
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

            {showRebook && booking.cleaner_id && (
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
                {hasReview && (
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

            {!awaitingApproval && !cancellable && !canReview && !canDispute && !showRebook && (
              <p className="text-sm text-neutral-500">
                No actions available for this booking right now.
              </p>
            )}
          </div>
        ),
      },
    ];
  }, [
    booking,
    showReceipt,
    trackable,
    cancellable,
    awaitingApproval,
    canReview,
    canDispute,
    hasReview,
    showRebook,
  ]);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/bookings" className="text-sm text-neutral-500 hover:text-neutral-900">
          My Bookings
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">{booking.booking_number}</h1>
      </div>
      <BubbleTabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
    </div>
  );
};
