'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { writeBookingStateEvent } from '@/features/booking/lib/booking-states';
import { settleApprovedBooking } from '@/features/booking/lib/settle-approval';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function getAuthedCleaner() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  return { supabase, userId: user.id };
}

export async function markEnRoute(bookingId: string) {
  const { supabase, userId } = await getAuthedCleaner();
  const { error } = await writeBookingStateEvent(supabase, bookingId, 'in_transit', userId);
  if (error) return { error: error.message };
  revalidatePath(`/cleaner/jobs/${bookingId}/on-my-way`);
  return { error: null };
}

export async function markRunningLate(bookingId: string, delayMinutes: number, reason?: string) {
  const { supabase, userId } = await getAuthedCleaner();
  await supabase
    .from('bookings')
    .update({
      is_running_late: true,
      late_estimate_minutes: delayMinutes,
      late_flagged_at: new Date().toISOString(),
    })
    .eq('id', bookingId);
  const { error } = await writeBookingStateEvent(supabase, bookingId, 'in_transit', userId, {
    running_late: true,
    delay_minutes: delayMinutes,
    reason,
  });
  if (error) return { error: error.message };
  revalidatePath(`/cleaner/jobs/${bookingId}/on-my-way`);
  return { error: null };
}

export async function markArrived(bookingId: string) {
  const { supabase, userId } = await getAuthedCleaner();
  const { error } = await writeBookingStateEvent(supabase, bookingId, 'arrived', userId);
  if (error) return { error: error.message };
  revalidatePath(`/cleaner/jobs/${bookingId}/on-my-way`);
  return { error: null };
}

export async function clockIn(bookingId: string) {
  const { supabase, userId } = await getAuthedCleaner();
  const { error } = await writeBookingStateEvent(supabase, bookingId, 'in_progress', userId);
  if (error) return { error: error.message };
  revalidatePath(`/cleaner/jobs/${bookingId}/active`);
  return { error: null };
}

export async function clockOut(bookingId: string) {
  const { supabase, userId } = await getAuthedCleaner();
  const { error } = await writeBookingStateEvent(supabase, bookingId, 'awaiting_approval', userId);
  if (error) return { error: error.message };
  revalidatePath(`/cleaner/jobs/${bookingId}`);
  redirect(`/cleaner/jobs/${bookingId}/complete`);
}

export async function submitRoomPhotos(
  bookingId: string,
  roomLabel: string,
  photoUrls: string[],
  captureLat?: number,
  captureLng?: number,
) {
  const { supabase, userId } = await getAuthedCleaner();
  const now = new Date().toISOString();
  const deleteAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const rows = photoUrls.map((url) => ({
    booking_id: bookingId,
    uploaded_by_user_id: userId,
    purpose: 'after_clock_out' as const,
    storage_key: url,
    file_size_bytes: 0,
    mime_type: 'image/jpeg',
    uploaded_at: now,
    room_label: roomLabel,
    capture_latitude: captureLat ?? null,
    capture_longitude: captureLng ?? null,
    delete_after_at: deleteAfter,
  }));

  const { error } = await supabase.from('booking_photos').insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/cleaner/jobs/${bookingId}/active`);
  return { error: null };
}

export async function approveWork(bookingId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  // RLS-scoped read acts as the ownership gate (only the booking's customer /
  // cleaner can see it).
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return { error: 'Booking not found.' };

  // Funnel through the shared settler so this approval path also captures the
  // payment and creates the cleaner payout (previously it was state-only).
  const admin = createSupabaseAdminClient();
  const result = await settleApprovedBooking(admin, {
    bookingId,
    newState: 'paid',
    actorUserId: user.id,
    reason: 'Customer approved completed work.',
  });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/app/bookings/${bookingId}`);
  return { error: null };
}
