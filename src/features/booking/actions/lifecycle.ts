'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { calculateCancellationPenalty } from '@/features/booking/lib/cancellation-policy';
import { writeBookingStateEvent } from '@/features/booking/lib/booking-states';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function cancelBooking(bookingId: string, reason?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, start_at, total_charge_cents')
    .eq('id', bookingId)
    .single();

  if (!booking) return { error: 'Booking not found' };

  const cancellable = ['booking_requested', 'confirmed', 'reschedule_pending'];
  if (!cancellable.includes(booking.state as string)) {
    return { error: 'This booking cannot be cancelled at this stage.' };
  }

  const penalty = calculateCancellationPenalty(
    new Date(booking.start_at),
    booking.total_charge_cents ?? 0,
  );

  const { error } = await writeBookingStateEvent(
    supabase,
    bookingId,
    'cancelled_by_customer',
    user.id,
    { reason, penalty_cents: penalty.penaltyCents },
  );

  if (error) return { error: error.message };

  if (penalty.penaltyCents > 0) {
    await supabase
      .from('bookings')
      .update({
        cancellation_reason: reason ?? null,
        cancellation_penalty_cents: penalty.penaltyCents,
      })
      .eq('id', bookingId);
  }

  revalidatePath('/app/bookings');
  return { error: null, penalty };
}

export async function requestReschedule(bookingId: string, newDate: string, newTime: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, start_at')
    .eq('id', bookingId)
    .single();

  if (!booking) return { error: 'Booking not found' };

  const schedulable = ['booking_requested', 'confirmed'];
  if (!schedulable.includes(booking.state as string)) {
    return { error: 'This booking cannot be rescheduled at this stage.' };
  }

  const hoursUntilStart = (new Date(booking.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilStart < 12) {
    return { error: 'Reschedules must be requested at least 12 hours before the appointment.' };
  }

  const { error } = await writeBookingStateEvent(
    supabase,
    bookingId,
    'reschedule_pending',
    user.id,
    { proposed_date: newDate, proposed_time: newTime },
  );

  if (error) return { error: error.message };

  revalidatePath(`/app/bookings/${bookingId}`);
  return { error: null };
}
