import { redirect } from 'next/navigation';

import { getMyCustomerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { RescheduleClient } from './RescheduleClient';

interface Props {
  params: Promise<{ id: string }>;
}

const ReschedulePage = async ({ params }: Props) => {
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
      `id, state, start_at,
       cleaner_profiles!bookings_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .eq('customer_id', customerProfileId)
    .single();

  if (!booking || !['booking_requested', 'confirmed'].includes(booking.state as string)) {
    redirect('/app/bookings');
  }

  const hoursUntil = (new Date(booking.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 12) {
    redirect(`/app/bookings/${id}`);
  }

  const clpRaw = Array.isArray(booking.cleaner_profiles)
    ? booking.cleaner_profiles[0]
    : booking.cleaner_profiles;
  const clpUser = Array.isArray((clpRaw as { users?: unknown })?.users)
    ? ((clpRaw as { users: unknown[] }).users)[0]
    : (clpRaw as { users?: unknown })?.users;
  const cleanerName = (clpUser as { full_name?: string } | null)?.full_name ?? 'Your cleaner';

  return (
    <RescheduleClient
      booking={{ id: booking.id, start_at: booking.start_at, cleaner_name: cleanerName }}
    />
  );
};

export default ReschedulePage;
