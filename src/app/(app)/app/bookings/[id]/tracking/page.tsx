import { redirect } from 'next/navigation';

import { getMyCustomerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { JobTrackerClient } from './JobTrackerClient';

interface Props {
  params: Promise<{ id: string }>;
}

const JobTrackerPage = async ({ params }: Props) => {
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
      `id, state, start_at, clock_in_at, clock_out_at, auto_approval_due_at,
       cleaner_profiles!bookings_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       ),
       booking_photos(id, room_label, cdn_url, uploaded_at)`,
    )
    .eq('id', id)
    .eq('customer_id', customerProfileId)
    .single();

  if (!booking) redirect('/app/bookings');

  const clpRaw = Array.isArray(booking.cleaner_profiles)
    ? booking.cleaner_profiles[0]
    : booking.cleaner_profiles;
  const clpUser = Array.isArray((clpRaw as { users?: unknown })?.users)
    ? (clpRaw as { users: unknown[] }).users[0]
    : (clpRaw as { users?: unknown })?.users;
  const cleanerName = (clpUser as { full_name?: string } | null)?.full_name ?? 'Your cleaner';

  const photos = (
    (booking.booking_photos ?? []) as {
      id: string;
      room_label: string | null;
      cdn_url: string | null;
      uploaded_at: string;
    }[]
  ).filter((p) => p.cdn_url && p.room_label);

  return (
    <JobTrackerClient
      booking={{
        id: booking.id,
        state: booking.state as string,
        start_at: booking.start_at,
        clock_in_at: booking.clock_in_at ?? null,
        clock_out_at: booking.clock_out_at ?? null,
        auto_approval_due_at: booking.auto_approval_due_at ?? null,
        cleaner_name: cleanerName,
      }}
      photos={photos.map((p) => ({
        id: p.id,
        room_label: p.room_label!,
        cdn_url: p.cdn_url!,
        uploaded_at: p.uploaded_at,
      }))}
      userId={user.id}
    />
  );
};

export default JobTrackerPage;
