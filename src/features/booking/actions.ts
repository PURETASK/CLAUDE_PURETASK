'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { stripe } from '@/lib/stripe/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { computeBookingPricing, getCommissionRate, type TierName } from './pricing';
import { createBookingSchema } from './validation';

export type BookingActionState = { ok: boolean; error: string | null };

const generateBookingNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `PT-${year}-${rand}`;
};

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
    .select(
      'id, hourly_rates_cents, current_tier, completed_booking_count, stripe_connect_account_id',
    )
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

  // Look up customer's default payment method
  const { data: defaultPm } = await admin
    .from('payment_methods')
    .select('id, stripe_customer_id, stripe_payment_method_id')
    .eq('customer_id', customerProfile.id)
    .eq('is_default', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (!defaultPm)
    return {
      ok: false,
      error: 'No payment method on file. Please add a card at Settings → Payment Methods.',
    };

  const commissionRate = getCommissionRate(
    cleaner.current_tier as TierName,
    cleaner.completed_booking_count,
  );

  const startAt = new Date(parsed.data.start_at);
  const endAt = new Date(startAt.getTime() + parsed.data.duration_hours * 60 * 60 * 1000);

  const {
    cleanerSubtotalCents: cleanerSubtotal,
    platformFeeCents: platformFee,
    totalChargeCents: totalCharge,
    cleanerPayoutCents: cleanerPayout,
  } = computeBookingPricing(hourlyRate, parsed.data.duration_hours, commissionRate);

  const bookingNumber = generateBookingNumber();

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
      hourly_rate_cents: hourlyRate,
      cleaner_subtotal_cents: cleanerSubtotal,
      platform_fee_cents: platformFee,
      total_charge_cents: totalCharge,
      tier_at_booking: cleaner.current_tier,
      commission_rate_at_booking: commissionRate,
      cleaner_payout_cents: cleanerPayout,
      customer_notes: parsed.data.customer_notes ?? null,
    })
    .select('id')
    .single();

  if (error || !booking) return { ok: false, error: error?.message ?? 'Failed to create booking.' };

  // Create Stripe PaymentIntent (manual capture — captured when customer approves)
  const idempotencyKey = `booking-${booking.id}-pi`;
  let piId: string | null = null;
  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: totalCharge,
        currency: 'usd',
        customer: defaultPm.stripe_customer_id,
        payment_method: defaultPm.stripe_payment_method_id,
        capture_method: 'manual',
        confirm: true,
        off_session: true,
        description: `PureTask booking ${bookingNumber}`,
        metadata: { booking_id: booking.id },
      },
      { idempotencyKey },
    );
    piId = pi.id;

    await admin.from('charges').insert({
      booking_id: booking.id,
      customer_id: customerProfile.id,
      payment_method_id: defaultPm.id,
      amount_cents: totalCharge,
      application_fee_cents: platformFee,
      currency: 'usd',
      state: 'authorized',
      stripe_payment_intent_id: pi.id,
      idempotency_key: idempotencyKey,
      authorized_at: new Date().toISOString(),
    });
  } catch (stripeErr) {
    // Roll back booking on payment failure
    await admin.from('bookings').delete().eq('id', booking.id);
    const msg = stripeErr instanceof Error ? stripeErr.message : 'Payment authorization failed.';
    return { ok: false, error: msg };
  }

  await admin.from('booking_state_events').insert({
    booking_id: booking.id,
    previous_state: null,
    new_state: 'booking_requested',
    triggered_by_user_id: user.id,
    reason: 'Customer created booking request.',
  });

  void piId; // referenced above, satisfies linter
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
