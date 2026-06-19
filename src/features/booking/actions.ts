'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { computeBookingPricing, generateBookingNumber } from './pricing';
import { createBookingSchema } from './validation';

export type BookingActionState = { ok: boolean; error: string | null };

const newBookingNumber = () =>
  generateBookingNumber(new Date().getFullYear(), Math.floor(Math.random() * 1_000_000));

export const createBookingAction = async (
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> => {
  const parsed = createBookingSchema.safeParse({
    cleaner_id: formData.get('cleaner_id'),
    service_type: formData.get('service_type'),
    address_id: formData.get('address_id'),
    start_at: formData.get('start_at'),
    duration_hours: Number(formData.get('duration_hours')),
    customer_notes: formData.get('customer_notes') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: customerProfile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();
  if (!customerProfile) return { ok: false, error: 'Customer profile not found.' };

  const admin = createSupabaseAdminClient();

  const { data: cleaner } = await admin
    .from('cleaner_profiles')
    .select('id, hourly_rates_cents, current_tier')
    .eq('id', parsed.data.cleaner_id)
    .eq('is_active', true)
    .single();
  if (!cleaner) return { ok: false, error: 'Cleaner not found.' };

  const rates = (cleaner.hourly_rates_cents ?? {}) as Record<string, number>;
  const hourlyRate = rates[parsed.data.service_type] ?? 0;
  if (hourlyRate === 0) return { ok: false, error: 'Cleaner does not offer this service.' };

  const { data: service } = await admin
    .from('services')
    .select('id')
    .eq('service_type', parsed.data.service_type)
    .single();
  if (!service) return { ok: false, error: 'Service not found.' };

  const startAt = new Date(parsed.data.start_at);
  const endAt = new Date(startAt.getTime() + parsed.data.duration_hours * 60 * 60 * 1000);

  const pricing = computeBookingPricing(hourlyRate, parsed.data.duration_hours);

  const bookingNumber = newBookingNumber();

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      customer_id: customerProfile.id,
      cleaner_id: cleaner.id,
      service_id: service.id,
      address_id: parsed.data.address_id,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      duration_hours_decimal: parsed.data.duration_hours,
      state: 'booking_requested',
      hourly_rate_cents: pricing.hourlyRateCents,
      cleaner_subtotal_cents: pricing.cleanerSubtotalCents,
      platform_fee_cents: pricing.platformFeeCents,
      total_charge_cents: pricing.totalChargeCents,
      tier_at_booking: cleaner.current_tier,
      commission_rate_at_booking: pricing.commissionRate,
      cleaner_payout_cents: pricing.cleanerPayoutCents,
      customer_notes: parsed.data.customer_notes ?? null,
    })
    .select('id')
    .single();

  if (error || !booking) return { ok: false, error: error?.message ?? 'Failed to create booking.' };

  await admin.from('booking_state_events').insert({
    booking_id: booking.id,
    previous_state: null,
    new_state: 'booking_requested',
    triggered_by_user_id: user.id,
    reason: 'Customer created booking request.',
  });

  redirect(`/app/bookings/${booking.id}`);
};

export const acceptBookingAction = async (bookingId: string): Promise<BookingActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, cleaner_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'booking_requested')
    return { ok: false, error: 'Booking cannot be accepted in its current state.' };

  const { error } = await supabase
    .from('bookings')
    .update({ state: 'confirmed' })
    .eq('id', bookingId);

  if (error) return { ok: false, error: error.message };

  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'booking_requested',
    new_state: 'confirmed',
    triggered_by_user_id: user.id,
    reason: 'Cleaner accepted booking.',
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  revalidatePath('/app/cleaner');
  return { ok: true, error: null };
};

export const declineBookingAction = async (bookingId: string): Promise<BookingActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'booking_requested')
    return { ok: false, error: 'Booking cannot be declined in its current state.' };

  const { error } = await supabase
    .from('bookings')
    .update({ state: 'cleaner_declined' })
    .eq('id', bookingId);

  if (error) return { ok: false, error: error.message };

  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'booking_requested',
    new_state: 'cleaner_declined',
    triggered_by_user_id: user.id,
    reason: 'Cleaner declined booking.',
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  revalidatePath('/app/cleaner');
  return { ok: true, error: null };
};

export const cancelBookingAction = async (bookingId: string): Promise<BookingActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  const cancellableStates = ['booking_requested', 'confirmed'];
  if (!cancellableStates.includes(booking.state)) {
    return { ok: false, error: 'Booking cannot be cancelled in its current state.' };
  }

  const { error } = await supabase
    .from('bookings')
    .update({ state: 'cancelled_by_customer', cancelled_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) return { ok: false, error: error.message };

  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: booking.state,
    new_state: 'cancelled_by_customer',
    triggered_by_user_id: user.id,
    reason: 'Customer cancelled booking.',
  });

  revalidatePath(`/app/bookings/${bookingId}`);
  revalidatePath('/app/bookings');
  return { ok: true, error: null };
};
