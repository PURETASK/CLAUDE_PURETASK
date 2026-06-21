'use client';

import { ArrowLeft, Repeat } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { MoneyRow } from '@/components/ui/money-row';
import { ApproveWorkButton } from '@/features/booking/components/ApproveWorkButton';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';

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

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex gap-4">
    <dt className="w-24 flex-shrink-0 text-neutral-400">{label}</dt>
    <dd className="min-w-0 flex-1 text-neutral-800">{value}</dd>
  </div>
);

export const BookingDetailTabs = ({
  booking,
  hasReview,
  trackable,
  cancellable,
  awaitingApproval,
  canReview,
  canDispute,
}: Props) => {
  const start = new Date(booking.start_at);
  const showReceipt = [
    'approved',
    'auto_approved',
    'paid',
    'disputed',
    'dispute_resolved',
  ].includes(booking.state);
  const showRebook = ['approved', 'auto_approved', 'paid', 'completed'].includes(booking.state);
  const showConnect = trackable || (Boolean(booking.cleaner_id) && booking.state !== 'cancelled');

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/bookings"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to bookings"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">#{booking.booking_number}</h1>
        <div className="ml-auto">
          <BookingStateBadge state={booking.state} />
        </div>
      </div>

      {/* Awaiting approval — the primary money action */}
      {awaitingApproval && (
        <Card elevation={1} className="border border-brand-200 bg-brand-50/50 p-5">
          <p className="font-semibold text-neutral-900">
            {booking.other_party_name} marked this job complete.
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Review the work and approve to release payment, or file a dispute within 24 hours.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ApproveWorkButton bookingId={booking.id} />
            <Link
              href={`/app/bookings/${booking.id}/dispute`}
              className="rounded-xl border border-error/30 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-light"
            >
              File a dispute
            </Link>
          </div>
          {trackable && (
            <Link
              href={`/app/bookings/${booking.id}/tracking`}
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Review photo evidence →
            </Link>
          )}
        </Card>
      )}

      {/* Overview */}
      <Card elevation={1} className="border border-neutral-200 p-5 text-sm">
        <dl className="flex flex-col gap-2">
          <DetailRow label="Service" value={booking.service_display_name} />
          <DetailRow label="Cleaner" value={booking.other_party_name} />
          <DetailRow label="Address" value={booking.address_street} />
          <DetailRow
            label="Date"
            value={start.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          />
          <DetailRow
            label="Time"
            value={`${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${booking.duration_hours_decimal}hr`}
          />
          {booking.customer_notes && (
            <DetailRow
              label="Notes"
              value={<span className="whitespace-pre-wrap">{booking.customer_notes}</span>}
            />
          )}
        </dl>
      </Card>

      {/* Connect: track + message */}
      {showConnect && (
        <div className="flex flex-col gap-3">
          {trackable && (
            <Link
              href={`/app/bookings/${booking.id}/tracking`}
              className="flex items-center justify-between rounded-2xl bg-gradient-brand px-5 py-4 font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
            >
              <span>Track your cleaner</span>
              <span aria-hidden>→</span>
            </Link>
          )}
          {booking.cleaner_id && booking.state !== 'cancelled' && (
            <Link
              href={`/app/bookings/${booking.id}/messages`}
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Message {booking.other_party_name}
            </Link>
          )}
        </div>
      )}

      {/* Pricing */}
      <Card elevation={1} className="border border-neutral-200 px-5 py-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-base font-semibold text-neutral-900">Pricing</p>
          {showReceipt && (
            <Link
              href={`/app/bookings/${booking.id}/receipt`}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View receipt →
            </Link>
          )}
        </div>
        <MoneyRow
          label={`${fmtPrice(booking.hourly_rate_cents)}/hr × ${booking.duration_hours_decimal}hr`}
          amount={fmtPrice(booking.cleaner_subtotal_cents)}
        />
        <MoneyRow
          label="PureTask service fee"
          amount={fmtPrice(booking.platform_fee_cents)}
          muted
        />
        <div className="mt-1 border-t border-neutral-100 pt-1">
          <MoneyRow label="Total" amount={fmtPrice(booking.total_charge_cents)} emphasis />
        </div>
      </Card>

      {/* Manage: reschedule / cancel */}
      {cancellable && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/app/bookings/${booking.id}/reschedule`}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Reschedule
          </Link>
          <Link
            href={`/app/bookings/${booking.id}/cancel`}
            className="flex-1 rounded-xl border border-error/30 px-4 py-2.5 text-center text-sm font-medium text-error transition-colors hover:bg-error-light"
          >
            Cancel booking
          </Link>
        </div>
      )}

      {/* Review / dispute after completion */}
      {(canReview || canDispute || hasReview) && (
        <div className="flex flex-wrap gap-3">
          {canReview && (
            <Link
              href={`/app/bookings/${booking.id}/review`}
              className="flex-1 rounded-xl bg-gradient-brand px-5 py-2.5 text-center text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
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
              className="rounded-xl border border-error/30 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error-light"
            >
              {booking.state === 'disputed' || booking.state === 'dispute_resolved'
                ? 'View dispute'
                : 'File a dispute'}
            </Link>
          )}
        </div>
      )}

      {/* Rebook nudge */}
      {showRebook && booking.cleaner_id && (
        <Card elevation={1} className="border border-brand-200 bg-brand-50/50 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Repeat className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Loved working with {booking.other_party_name}?
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                Book them again — they already know your home.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/app/cleaners/${booking.cleaner_id}/book`}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Book again
                </Link>
                <Link
                  href="/app/recurring/new"
                  className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  Set up recurring
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
