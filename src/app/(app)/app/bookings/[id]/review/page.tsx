import { notFound, redirect } from 'next/navigation';

import { getMyCustomerProfileId } from '@/features/booking/queries';
import { Card } from '@/components/ui/card';
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
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">
          How was {booking.other_party_name}?
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {booking.service_display_name} · #{booking.booking_number}
        </p>
      </div>
      <Card elevation={1} className="border border-neutral-200 p-6">
        <ReviewForm bookingId={id} traits={traits} />
      </Card>
    </div>
  );
}
