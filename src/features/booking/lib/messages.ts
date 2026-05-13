import type { SupabaseClient } from '@supabase/supabase-js';

export async function getMessages(supabase: SupabaseClient, bookingId: string) {
  return supabase
    .from('messages')
    .select(
      'id, body, created_at, expires_at, sender_id, sender:users!sender_id(full_name, avatar_url)',
    )
    .eq('booking_id', bookingId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true });
}

export async function sendMessage(
  supabase: SupabaseClient,
  bookingId: string,
  senderId: string,
  body: string,
  expiresAt: Date,
) {
  return supabase.from('messages').insert({
    booking_id: bookingId,
    sender_id: senderId,
    body: body.trim(),
    expires_at: expiresAt.toISOString(),
  });
}
