import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type DisputeRow = {
  id: string;
  booking_id: string;
  booking_number: string;
  state: string;
  issue_category: string;
  customer_desired_outcome: string;
  customer_description: string;
  cleaner_response_type: string | null;
  cleaner_response_message: string | null;
  cleaner_response_amount_cents: number | null;
  cleaner_responded_at: string | null;
  cleaner_response_due_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_amount_cents: number | null;
  resolution_notes: string | null;
  created_at: string;
  customer_name: string;
  cleaner_name: string;
};

export type DisputeMessageRow = {
  id: string;
  sender_role: string;
  sender_name: string;
  body: string;
  created_at: string;
};

export type AdminDisputeListItem = {
  id: string;
  state: string;
  issue_category: string;
  created_at: string;
  booking_number: string;
  customer_name: string;
  cleaner_name: string;
};

const mapDisputeRow = (
  data: Record<string, unknown>,
  customerName: string,
  cleanerName: string,
  bookingNumber: string,
): DisputeRow => ({
  id: data.id as string,
  booking_id: data.booking_id as string,
  booking_number: bookingNumber,
  state: data.state as string,
  issue_category: data.issue_category as string,
  customer_desired_outcome: data.customer_desired_outcome as string,
  customer_description: data.customer_description as string,
  cleaner_response_type: (data.cleaner_response_type as string | null) ?? null,
  cleaner_response_message: (data.cleaner_response_message as string | null) ?? null,
  cleaner_response_amount_cents: (data.cleaner_response_amount_cents as number | null) ?? null,
  cleaner_responded_at: (data.cleaner_responded_at as string | null) ?? null,
  cleaner_response_due_at: data.cleaner_response_due_at as string,
  resolved_at: (data.resolved_at as string | null) ?? null,
  resolution_type: (data.resolution_type as string | null) ?? null,
  resolution_amount_cents: (data.resolution_amount_cents as number | null) ?? null,
  resolution_notes: (data.resolution_notes as string | null) ?? null,
  created_at: data.created_at as string,
  customer_name: customerName,
  cleaner_name: cleanerName,
});

const extractName = (profile: unknown, fallback: string): string => {
  if (!profile) return fallback;
  const p = (Array.isArray(profile) ? (profile as unknown[])[0] : profile) as {
    users?: unknown;
  } | null;
  if (!p) return fallback;
  const u = (Array.isArray(p.users) ? (p.users as unknown[])[0] : p.users) as {
    full_name?: string;
  } | null;
  return u?.full_name ?? fallback;
};

export const getDisputeForBooking = async (bookingId: string): Promise<DisputeRow | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('disputes')
    .select(
      `id, booking_id, state, issue_category, customer_desired_outcome, customer_description,
       cleaner_response_type, cleaner_response_message, cleaner_response_amount_cents,
       cleaner_responded_at, cleaner_response_due_at, resolved_at, resolution_type,
       resolution_amount_cents, resolution_notes, created_at,
       bookings!disputes_booking_id_fkey(booking_number),
       customer_profiles!disputes_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       ),
       cleaner_profiles!disputes_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (!data) return null;

  const booking = Array.isArray(data.bookings) ? data.bookings[0] : data.bookings;
  const bookingNumber = (booking as { booking_number: string } | null)?.booking_number ?? '—';

  return mapDisputeRow(
    data as unknown as Record<string, unknown>,
    extractName(data.customer_profiles, 'Customer'),
    extractName(data.cleaner_profiles, 'Cleaner'),
    bookingNumber,
  );
};

export const getDisputeById = async (id: string): Promise<DisputeRow | null> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('disputes')
    .select(
      `id, booking_id, state, issue_category, customer_desired_outcome, customer_description,
       cleaner_response_type, cleaner_response_message, cleaner_response_amount_cents,
       cleaner_responded_at, cleaner_response_due_at, resolved_at, resolution_type,
       resolution_amount_cents, resolution_notes, created_at,
       bookings!disputes_booking_id_fkey(booking_number),
       customer_profiles!disputes_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       ),
       cleaner_profiles!disputes_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .eq('id', id)
    .single();

  if (!data) return null;

  const booking = Array.isArray(data.bookings) ? data.bookings[0] : data.bookings;
  const bookingNumber = (booking as { booking_number: string } | null)?.booking_number ?? '—';

  return mapDisputeRow(
    data as unknown as Record<string, unknown>,
    extractName(data.customer_profiles, 'Customer'),
    extractName(data.cleaner_profiles, 'Cleaner'),
    bookingNumber,
  );
};

export const getDisputeMessages = async (disputeId: string): Promise<DisputeMessageRow[]> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('dispute_messages')
    .select(
      `id, sender_role, body, created_at,
       users!dispute_messages_sender_user_id_fkey(full_name)`,
    )
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      sender_role: row.sender_role,
      sender_name: (u as { full_name: string } | null)?.full_name ?? row.sender_role,
      body: row.body,
      created_at: row.created_at,
    };
  });
};

export const getOpenDisputesForAdmin = async (): Promise<AdminDisputeListItem[]> => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('disputes')
    .select(
      `id, state, issue_category, created_at,
       bookings!disputes_booking_id_fkey(booking_number),
       customer_profiles!disputes_customer_id_fkey(
         users!customer_profiles_user_id_fkey(full_name)
       ),
       cleaner_profiles!disputes_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       )`,
    )
    .in('state', ['open', 'cleaner_responded', 'awaiting_customer', 'escalated', 'in_mediation'])
    .order('created_at', { ascending: true });

  return (data ?? []).map((row) => {
    const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    return {
      id: row.id,
      state: row.state,
      issue_category: row.issue_category,
      created_at: row.created_at,
      booking_number: (booking as { booking_number: string } | null)?.booking_number ?? '—',
      customer_name: extractName(row.customer_profiles, 'Customer'),
      cleaner_name: extractName(row.cleaner_profiles, 'Cleaner'),
    };
  });
};
