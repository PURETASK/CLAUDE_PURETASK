import { redirect } from 'next/navigation';

import { calculateCancellationPenalty } from '@/features/booking/lib/cancellation-policy';
import { getMyCustomerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { CancelBookingClient } from './CancelBookingClient';

interface Props {
  params: Promise<{ id: string }>;
}

const CancelBookingPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const customerProfileId = await getMyCustomerProfileId();
  if (!customerProfileId) redirect('/app');

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `id, state, start_at, total_charge_cents,
       cleaner_profiles!bookings_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .eq('customer_id', customerProfileId)
    .single();

  if (!booking || !['booking_requested', 'confirmed', 'reschedule_pending'].includes(booking.state as string)) {
    redirect('/app/bookings');
  }

  const clpRaw = Array.isArray(booking.cleaner_profiles)
    ? booking.cleaner_profiles[0]
    : booking.cleaner_profiles;
  const clpUser = Array.isArray((clpRaw as { users?: unknown })?.users)
    ? ((clpRaw as { users: unknown[] }).users)[0]
    : (clpRaw as { users?: unknown })?.users;
  const cleanerName = (clpUser as { full_name?: string } | null)?.full_name ?? 'Your cleaner';

  const penalty = calculateCancellationPenalty(
    new Date(booking.start_at),
    booking.total_charge_cents ?? 0,
  );

  return (
    <CancelBookingClient
      booking={{ id: booking.id, start_at: booking.start_at, total_charge_cents: booking.total_charge_cents ?? 0, cleaner_name: cleanerName }}
      penalty={penalty}
    />
  );
};

export default CancelBookingPage;
