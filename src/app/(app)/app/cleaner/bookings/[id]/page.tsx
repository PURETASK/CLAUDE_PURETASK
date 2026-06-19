import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CleanerActionButtons } from '@/features/booking/components/CleanerActionButtons';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { getBookingById, getMyCleanerProfileId } from '@/features/booking/queries';
import { ClockButtons } from '@/features/verification/components/ClockButtons';
import { PhotoGrid } from '@/features/verification/components/PhotoGrid';
import { PhotoUploader } from '@/features/verification/components/PhotoUploader';
import {
  missingPhotos,
  REQUIRED_PHOTO_COUNTS,
  type ServiceType,
} from '@/features/verification/photo-rules';
import { getPhotoCounts } from '@/features/verification/queries';
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
  const showClock = ['confirmed', 'imminent', 'in_transit', 'arrived', 'in_progress'].includes(
    booking.state,
  );
  const showUploaders = booking.state === 'in_progress';
  const showPhotos = [
    'in_progress',
    'completed',
    'awaiting_approval',
    'approved',
    'auto_approved',
    'paid',
    'disputed',
    'dispute_resolved',
  ].includes(booking.state);

  const serviceType = (booking.service_type as ServiceType) ?? 'standard';
  const counts =
    showUploaders || showPhotos ? await getPhotoCounts(booking.id) : { before: 0, after: 0 };
  const missing = missingPhotos(counts, serviceType);
  const required = REQUIRED_PHOTO_COUNTS[serviceType];

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/cleaner" className="text-sm text-zinc-500 hover:text-zinc-900">
          Dashboard
        </Link>
        <span className="text-zinc-300">/</span>
        <h1 className="text-xl font-semibold">{booking.booking_number}</h1>
      </div>

      <section className="rounded border bg-white p-5 text-sm">
        <div className="mb-4 flex items-center gap-3">
          <BookingStateBadge state={booking.state} />
          <span className="text-zinc-400">#{booking.booking_number}</span>
        </div>
        <div className="flex flex-col gap-2 text-zinc-600">
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-zinc-400">Service</span>
            <span>{booking.service_display_name}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-zinc-400">Customer</span>
            <span>{booking.other_party_name}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-zinc-400">Address</span>
            <span>{booking.address_street}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-28 shrink-0 text-zinc-400">Date</span>
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
            <span className="w-28 shrink-0 text-zinc-400">Time</span>
            <span>
              {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ·{' '}
              {booking.duration_hours_decimal}hr
            </span>
          </div>
          {booking.customer_notes && (
            <div className="flex gap-4">
              <span className="w-28 shrink-0 text-zinc-400">Notes</span>
              <span className="whitespace-pre-wrap">{booking.customer_notes}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded border bg-white p-5 text-sm">
        <p className="mb-3 font-medium">Your earnings</p>
        <div className="flex flex-col gap-1.5 text-zinc-600">
          <div className="flex justify-between">
            <span>
              {fmtPrice(booking.hourly_rate_cents)}/hr × {booking.duration_hours_decimal}hr
            </span>
            <span>{fmtPrice(booking.cleaner_subtotal_cents)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-1 font-medium text-zinc-900">
            <span>Your payout</span>
            <span>{fmtPrice(booking.cleaner_payout_cents)}</span>
          </div>
        </div>
      </section>

      {isRequested && <CleanerActionButtons bookingId={booking.id} />}

      {showClock && <ClockButtons bookingId={booking.id} state={booking.state} />}

      {showUploaders && (
        <section className="rounded border bg-white p-5 text-sm">
          <p className="mb-3 font-medium">
            Required photos · {required.before} before / {required.after} after
          </p>
          <div className="flex flex-col gap-4">
            <PhotoUploader
              bookingId={booking.id}
              purpose="before_clock_in"
              remaining={missing.before}
              label={`Before photos (${counts.before}/${required.before})`}
            />
            <PhotoUploader
              bookingId={booking.id}
              purpose="after_clock_out"
              remaining={missing.after}
              label={`After photos (${counts.after}/${required.after})`}
            />
          </div>
        </section>
      )}

      {showPhotos && (
        <section className="rounded border bg-white p-5 text-sm">
          <p className="mb-3 font-medium">Photos</p>
          <PhotoGrid bookingId={booking.id} />
        </section>
      )}
    </div>
  );
};

export default CleanerBookingDetailPage;
