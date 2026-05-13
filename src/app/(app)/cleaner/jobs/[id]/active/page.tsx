import { redirect } from 'next/navigation';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { ActiveJobClient } from './ActiveJobClient';

const REQUIRED_ROOMS = ['Living Room', 'Kitchen', 'Bathroom', 'Bedroom'];

interface Props {
  params: Promise<{ id: string }>;
}

const ActiveJobPage = async ({ params }: Props) => {
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
      `id, state, start_at, clock_in_at,
       addresses!bookings_address_id_fkey(street_1, city),
       customer_profiles!bookings_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       ),
       booking_photos(room_label, cdn_url)`,
    )
    .eq('id', id)
    .eq('cleaner_id', cleanerProfileId)
    .single();

  if (!booking || !['arrived', 'in_progress'].includes(booking.state as string)) {
    redirect('/app/cleaner');
  }

  const addr = Array.isArray(booking.addresses) ? booking.addresses[0] : booking.addresses;
  const cpRaw = Array.isArray(booking.customer_profiles)
    ? booking.customer_profiles[0]
    : booking.customer_profiles;
  const cpUser = Array.isArray((cpRaw as { users?: unknown })?.users)
    ? (cpRaw as { users: unknown[] }).users[0]
    : (cpRaw as { users?: unknown })?.users;
  const customerName = (cpUser as { full_name?: string } | null)?.full_name ?? 'Customer';

  const photos = (booking.booking_photos ?? []) as {
    room_label: string | null;
    cdn_url: string | null;
  }[];
  const uploadedRooms = new Set(photos.map((p) => p.room_label).filter(Boolean) as string[]);

  return (
    <ActiveJobClient
      booking={{
        id: booking.id,
        state: booking.state as string,
        start_at: booking.start_at,
        clock_in_at: booking.clock_in_at ?? null,
        customer_name: customerName,
        address: addr
          ? `${(addr as { street_1: string }).street_1}, ${(addr as { city: string }).city}`
          : '',
      }}
      uploadedRooms={uploadedRooms}
      requiredRooms={REQUIRED_ROOMS}
    />
  );
};

export default ActiveJobPage;
