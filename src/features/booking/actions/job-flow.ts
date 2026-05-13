'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { writeBookingStateEvent } from '@/features/booking/lib/booking-states';
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

  const { error } = await writeBookingStateEvent(supabase, bookingId, 'approved', user.id);
  if (error) return { error: error.message };

  revalidatePath(`/app/bookings/${bookingId}`);
  return { error: null };
}
