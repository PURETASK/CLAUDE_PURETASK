import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';

import { RescheduleForm } from './RescheduleForm';

type Props = { params: Promise<{ id: string }> };

/** Next 14 days, computed server-side so the client form hydrates deterministically. */
function buildDateOptions() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
}

export default async function RescheduleBookingPage({ params }: Props) {
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

  const dateOptions = buildDateOptions();

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
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Reschedule cleaning</h1>
          <p className="text-xs text-neutral-500">
            {booking.booking_number} · {booking.service_display_name}
          </p>
        </div>
      </div>

      <RescheduleForm bookingId={id} currentStartAt={booking.start_at} dateOptions={dateOptions} />
    </div>
  );
}
