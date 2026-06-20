import { notFound, redirect } from 'next/navigation';

import { BookingDetailTabs } from '@/features/booking/components/BookingDetailTabs';
import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { getReviewForBooking } from '@/features/reviews/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

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
    <BookingDetailTabs
      booking={{
        id: booking.id,
        booking_number: booking.booking_number,
        state: booking.state,
        service_display_name: booking.service_display_name,
        other_party_name: booking.other_party_name,
        address_street: booking.address_street,
        start_at: booking.start_at,
        duration_hours_decimal: booking.duration_hours_decimal,
        customer_notes: booking.customer_notes,
        hourly_rate_cents: booking.hourly_rate_cents,
        cleaner_subtotal_cents: booking.cleaner_subtotal_cents,
        platform_fee_cents: booking.platform_fee_cents,
        total_charge_cents: booking.total_charge_cents,
        cleaner_id: booking.cleaner_id,
      }}
      hasReview={Boolean(existingReview)}
      trackable={trackable}
      cancellable={cancellable}
      awaitingApproval={awaitingApproval}
      canReview={canReview}
      canDispute={canDispute}
    />
  );
};

export default CustomerBookingDetailPage;
