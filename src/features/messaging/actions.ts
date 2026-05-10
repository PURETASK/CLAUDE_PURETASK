'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type MessageActionState = { ok: boolean; error: string | null };

const MESSAGING_STATES = [
  'confirmed',
  'imminent',
  'in_transit',
  'arrived',
  'in_progress',
  'completed',
  'awaiting_approval',
  'approved',
  'auto_approved',
  'paid',
  'disputed',
  'dispute_resolved',
  'reschedule_pending',
];

export const sendMessageAction = async (
  bookingId: string,
  body: string,
): Promise<MessageActionState> => {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { ok: false, error: 'Message must be between 1 and 2000 characters.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `id, state, end_at, clock_out_at,
       customer_profiles!bookings_customer_id_fkey(user_id),
       cleaner_profiles!bookings_cleaner_id_fkey(user_id)`,
    )
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };

  if (!MESSAGING_STATES.includes(booking.state)) {
    return { ok: false, error: 'Messaging is not available for this booking.' };
  }

  const cpProfile = Array.isArray(booking.customer_profiles)
    ? booking.customer_profiles[0]
    : booking.customer_profiles;
  const clpProfile = Array.isArray(booking.cleaner_profiles)
    ? booking.cleaner_profiles[0]
    : booking.cleaner_profiles;

  let senderRole: 'customer' | 'cleaner' | null = null;
  if ((cpProfile as { user_id?: string } | null)?.user_id === user.id) senderRole = 'customer';
  else if ((clpProfile as { user_id?: string } | null)?.user_id === user.id) senderRole = 'cleaner';

  if (!senderRole) return { ok: false, error: 'You are not a participant in this booking.' };

  const clockOut = (booking as { clock_out_at?: string | null }).clock_out_at;
  const refTime = clockOut ?? booking.end_at;
  const expiresAt = new Date(new Date(refTime).getTime() + 4 * 60 * 60 * 1000).toISOString();

  if (new Date(expiresAt) < new Date()) {
    return { ok: false, error: 'The chat for this booking has expired.' };
  }

  const { error } = await supabase.from('messages').insert({
    booking_id: bookingId,
    sender_user_id: user.id,
    sender_role: senderRole,
    body: trimmed,
    expires_at: expiresAt,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/bookings/${bookingId}/messages`);
  return { ok: true, error: null };
};
