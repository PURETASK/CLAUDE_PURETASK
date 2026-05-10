import { createSupabaseServerClient } from '@/lib/supabase/server';

export type MessageRow = {
  id: string;
  body: string;
  sender_role: 'customer' | 'cleaner' | 'system';
  sender_name: string;
  created_at: string;
  expires_at: string;
};

export type BookingForMessaging = {
  id: string;
  bookingNumber: string;
  state: string;
  expiresAt: string;
  isExpired: boolean;
  userRole: 'customer' | 'cleaner';
  userId: string;
  otherPartyName: string;
};

const extractName = (profile: unknown, fallback: string): string => {
  const p = Array.isArray(profile) ? profile[0] : profile;
  if (!p) return fallback;
  const u = Array.isArray((p as { users?: unknown }).users)
    ? ((p as { users: unknown[] }).users)[0]
    : (p as { users?: unknown }).users;
  return (u as { full_name?: string } | null)?.full_name ?? fallback;
};

const extractUserId = (profile: unknown): string | null => {
  const p = Array.isArray(profile) ? profile[0] : profile;
  return (p as { user_id?: string } | null)?.user_id ?? null;
};

export const getBookingForMessaging = async (
  bookingId: string,
): Promise<BookingForMessaging | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('bookings')
    .select(
      `id, booking_number, state, end_at, clock_out_at,
       customer_profiles!bookings_customer_id_fkey(
         user_id, users!customer_profiles_user_id_fkey(full_name)
       ),
       cleaner_profiles!bookings_cleaner_id_fkey(
         user_id, users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', bookingId)
    .single();

  if (!data) return null;

  const cpUserId = extractUserId(data.customer_profiles);
  const clpUserId = extractUserId(data.cleaner_profiles);

  let userRole: 'customer' | 'cleaner' | null = null;
  let otherPartyName = '';

  if (cpUserId === user.id) {
    userRole = 'customer';
    otherPartyName = extractName(data.cleaner_profiles, 'Your Cleaner');
  } else if (clpUserId === user.id) {
    userRole = 'cleaner';
    otherPartyName = extractName(data.customer_profiles, 'Your Customer');
  }

  if (!userRole) return null;

  const refTime = (data as { clock_out_at?: string | null }).clock_out_at ?? data.end_at;
  const expiresAt = new Date(new Date(refTime).getTime() + 4 * 60 * 60 * 1000).toISOString();

  return {
    id: data.id,
    bookingNumber: data.booking_number,
    state: data.state,
    expiresAt,
    isExpired: new Date(expiresAt) < new Date(),
    userRole,
    userId: user.id,
    otherPartyName,
  };
};

export const getMessages = async (bookingId: string): Promise<MessageRow[]> => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('messages')
    .select(`id, body, sender_role, created_at, expires_at, users!messages_sender_user_id_fkey(full_name)`)
    .eq('booking_id', bookingId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      body: row.body,
      sender_role: row.sender_role as 'customer' | 'cleaner' | 'system',
      sender_name: (u as { full_name?: string } | null)?.full_name ?? row.sender_role,
      created_at: row.created_at,
      expires_at: row.expires_at,
    };
  });
};
