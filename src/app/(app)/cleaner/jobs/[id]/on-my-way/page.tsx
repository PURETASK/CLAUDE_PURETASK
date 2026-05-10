import { redirect } from 'next/navigation';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { OnMyWayClient } from './OnMyWayClient';

interface Props {
  params: Promise<{ id: string }>;
}

const OnMyWayPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/cleaner/apply');

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `id, state, start_at, is_running_late, late_estimate_minutes,
       addresses!bookings_address_id_fkey(street_1, city, state, zip_code),
       customer_profiles!bookings_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .eq('cleaner_id', cleanerProfileId)
    .single();

  if (!booking || !['confirmed', 'imminent', 'in_transit', 'arrived'].includes(booking.state as string)) {
    redirect('/app/cleaner');
  }

  const addr = Array.isArray(booking.addresses) ? booking.addresses[0] : booking.addresses;
  const cpRaw = Array.isArray(booking.customer_profiles)
    ? booking.customer_profiles[0]
    : booking.customer_profiles;
  const cpUser = Array.isArray((cpRaw as { users?: unknown })?.users)
    ? ((cpRaw as { users: unknown[] }).users)[0]
    : (cpRaw as { users?: unknown })?.users;
  const customerName = (cpUser as { full_name?: string } | null)?.full_name ?? 'Customer';

  return (
    <OnMyWayClient
      booking={{
        id: booking.id,
        state: booking.state as string,
        start_at: booking.start_at,
        is_running_late: booking.is_running_late ?? false,
        late_estimate_minutes: booking.late_estimate_minutes ?? null,
        address: addr
          ? {
              street_1: (addr as { street_1: string }).street_1,
              city: (addr as { city: string }).city,
              state: (addr as { state: string }).state,
              zip_code: (addr as { zip_code: string }).zip_code,
            }
          : null,
        customer_name: customerName,
      }}
    />
  );
};

export default OnMyWayPage;
