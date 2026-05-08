import { notFound, redirect } from 'next/navigation';

import { getMyCustomerProfileId } from '@/features/booking/queries';
import { getReviewForBooking, getActiveTraits } from '@/features/reviews/queries';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { getBookingById } from '@/features/booking/queries';

type Props = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const [booking, customerProfileId, existingReview, traits] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
    getReviewForBooking(id),
    getActiveTraits(),
  ]);

  if (!booking || !customerProfileId) notFound();
  if (booking.customer_id !== customerProfileId) notFound();

  const reviewableStates = ['approved', 'auto_approved', 'paid', 'disputed', 'dispute_resolved'];
  if (!reviewableStates.includes(booking.state)) {
    redirect(`/app/bookings/${id}`);
  }

  if (existingReview) {
    redirect(`/app/bookings/${id}?reviewed=1`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Leave a review</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Booking {booking.booking_number} · {booking.service_display_name}
      </p>
      <ReviewForm bookingId={id} traits={traits} />
    </div>
  );
}
