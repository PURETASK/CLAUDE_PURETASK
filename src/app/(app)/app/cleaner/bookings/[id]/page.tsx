import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyRow } from '@/components/ui/money-row';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { CleanerActionButtons } from '@/features/booking/components/CleanerActionButtons';
import { getBookingById, getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex gap-4">
    <span className="w-24 flex-shrink-0 text-neutral-400">{label}</span>
    <span className="min-w-0 flex-1 text-neutral-800">{value}</span>
  </div>
);

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
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/app/cleaner/bookings"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">#{booking.booking_number}</h1>
        <div className="ml-auto">
          <BookingStateBadge state={booking.state} />
        </div>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-5 text-sm">
        <div className="flex flex-col gap-2">
          <Row label="Service" value={booking.service_display_name} />
          <Row label="Customer" value={booking.other_party_name} />
          <Row label="Address" value={booking.address_street} />
          <Row
            label="Date"
            value={start.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          />
          <Row
            label="Time"
            value={`${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${booking.duration_hours_decimal}hr`}
          />
          {booking.customer_notes && (
            <Row
              label="Notes"
              value={<span className="whitespace-pre-wrap">{booking.customer_notes}</span>}
            />
          )}
        </div>
      </Card>

      <Card elevation={1} className="border border-neutral-200 px-5 py-4">
        <p className="mb-1 text-base font-semibold text-neutral-900">Your earnings</p>
        <MoneyRow
          label={`${fmtPrice(booking.hourly_rate_cents)}/hr × ${booking.duration_hours_decimal}hr`}
          amount={fmtPrice(booking.cleaner_subtotal_cents)}
        />
        <div className="mt-1 border-t border-neutral-100 pt-1">
          <MoneyRow label="Your payout" amount={fmtPrice(booking.cleaner_payout_cents)} emphasis />
        </div>
      </Card>

      <Link
        href={`/app/cleaner/bookings/${booking.id}/messages`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        <MessageSquare className="h-4 w-4" strokeWidth={1.8} />
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
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          View submitted job · awaiting customer approval
        </Link>
      )}
      {hasDispute && (
        <Link
          href={`/app/cleaner/bookings/${booking.id}/dispute`}
          className="rounded-xl border border-error/30 px-4 py-2.5 text-center text-sm font-medium text-error transition-colors hover:bg-error-light"
        >
          View dispute
        </Link>
      )}
    </div>
  );
};

export default CleanerBookingDetailPage;
