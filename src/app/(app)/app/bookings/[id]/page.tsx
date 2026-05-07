import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CancelBookingButton } from '@/features/booking/components/CancelBookingButton';
import { BookingStateBadge } from '@/features/booking/components/BookingStateBadge';
import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
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

  const start = new Date(booking.start_at);
  const cancellable = ['booking_requested', 'confirmed'].includes(booking.state);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/bookings" className="text-sm text-zinc-500 hover:text-zinc-900">
          My Bookings
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
            <span className="w-28 shrink-0 text-zinc-400">Cleaner</span>
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
        <p className="mb-3 font-medium">Pricing</p>
        <div className="flex flex-col gap-1.5 text-zinc-600">
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
          <div className="mt-1 flex justify-between border-t pt-1 font-medium text-zinc-900">
            <span>Total</span>
            <span>{fmtPrice(booking.total_charge_cents)}</span>
          </div>
        </div>
      </section>

      {cancellable && <CancelBookingButton bookingId={booking.id} />}
    </div>
  );
};

export default CustomerBookingDetailPage;
