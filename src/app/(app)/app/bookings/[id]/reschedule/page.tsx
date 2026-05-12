import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { RescheduleForm } from './RescheduleForm';

type Props = { params: Promise<{ id: string }> };

export default async function RescheduleBookingPage({ params }: Props) {
  const { id } = await params;

  const [booking, customerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
  ]);

  if (!booking) notFound();
  if (booking.customer_id !== customerProfileId) notFound();

  const rescheduleableStates = ['booking_requested', 'confirmed'];
  if (!rescheduleableStates.includes(booking.state)) {
    redirect(`/app/bookings/${id}`);
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <Link href={`/app/bookings/${id}`} className="mb-6 block text-sm text-neutral-500 hover:text-neutral-700">
        ← Back to booking
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier1">
        <h1 className="text-xl font-bold text-neutral-900">Reschedule booking</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {booking.booking_number} · {booking.service_display_name}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Your cleaner has 4 hours to confirm the new time slot.
        </p>

        <div className="mt-6">
          <RescheduleForm bookingId={id} currentStartAt={booking.start_at} />
        </div>
      </div>
    </div>
  );
}
