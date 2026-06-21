'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { notify } from '@/features/notifications/dispatch';
import { bookingConfirmedEmail, newBookingRequestEmail } from '@/lib/email/templates';
import { INTEGRATION_MESSAGES, isStripeConfigured } from '@/lib/integrations';
import { getStripe } from '@/lib/stripe/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { calculateCancellationPenalty } from './lib/cancellation-policy';
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

  if (!isStripeConfigured()) {
    return { ok: false, error: INTEGRATION_MESSAGES.stripe };
  }

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
    const pi = await getStripe().paymentIntents.create(
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

  // Notify cleaner of the new request — in-app + push + SMS + email (fire-and-forget)
  void (async () => {
    const { data: cleanerProfile } = await admin
      .from('cleaner_profiles')
      .select('user_id')
      .eq('id', cleaner.id)
      .single();
    if (!cleanerProfile?.user_id) return;
    const { data: cleanerUser } = await admin
      .from('users')
      .select('full_name')
      .eq('id', cleanerProfile.user_id)
      .single();
    const { data: customerProfile2 } = await admin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const customerName = customerProfile2?.full_name ?? 'A customer';
    await notify({
      recipientUserId: cleanerProfile.user_id,
      type: 'booking_request_sent',
      title: 'New booking request',
      body: `${customerName} requested a cleaning on ${startAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
      deepLink: `/app/cleaner/bookings/${booking.id}`,
      relatedBookingId: booking.id,
      email: newBookingRequestEmail({
        cleanerName: cleanerUser?.full_name ?? 'Cleaner',
        customerName,
        bookingNumber,
        serviceDate: startAt.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        bookingId: booking.id,
      }),
    });
  })();

  void piId;
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

  // Authorization: caller must be the active cleaner assigned to this booking.
  const { data: callerProfile } = await supabase
    .from('cleaner_profiles')
    .select('id, is_active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!callerProfile || callerProfile.id !== booking.cleaner_id)
    return { ok: false, error: 'You are not assigned to this booking.' };
  if (!callerProfile.is_active)
    return { ok: false, error: 'Your cleaner account is not active yet.' };

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

  // Notify customer that booking is confirmed (fire-and-forget)
  void (async () => {
    const { data: fullBooking } = await admin
      .from('bookings')
      .select('booking_number, start_at, customer_id, cleaner_id')
      .eq('id', bookingId)
      .single();
    if (!fullBooking) return;
    const [{ data: customerProfile }, { data: cleanerProfile }] = await Promise.all([
      admin.from('customer_profiles').select('user_id').eq('id', fullBooking.customer_id).single(),
      admin
        .from('cleaner_profiles')
        .select('user_id')
        .eq('id', fullBooking.cleaner_id ?? '')
        .single(),
    ]);
    if (!customerProfile?.user_id) return;
    const [{ data: customerUser }, { data: cleanerUser }] = await Promise.all([
      admin.from('users').select('full_name').eq('id', customerProfile.user_id).single(),
      admin
        .from('users')
        .select('full_name')
        .eq('id', cleanerProfile?.user_id ?? '')
        .single(),
    ]);
    const cleanerName = cleanerUser?.full_name ?? 'Your cleaner';
    await notify({
      recipientUserId: customerProfile.user_id,
      type: 'booking_request_accepted',
      title: 'Booking confirmed',
      body: `${cleanerName} accepted your cleaning (${fullBooking.booking_number}).`,
      deepLink: `/app/bookings/${bookingId}`,
      relatedBookingId: bookingId,
      email: bookingConfirmedEmail({
        customerName: customerUser?.full_name ?? 'Customer',
        cleanerName,
        bookingNumber: fullBooking.booking_number,
        serviceDate: new Date(fullBooking.start_at).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        bookingId,
      }),
    });
  })();

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
    .select('id, state, cleaner_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'booking_requested')
    return { ok: false, error: 'Booking cannot be declined in its current state.' };

  // Authorization: caller must be the cleaner assigned to this booking.
  const { data: callerProfile } = await supabase
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!callerProfile || callerProfile.id !== booking.cleaner_id)
    return { ok: false, error: 'You are not assigned to this booking.' };

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

  // Notify the customer their request was declined (fire-and-forget)
  void (async () => {
    const { data: fullBooking } = await admin
      .from('bookings')
      .select('booking_number, customer_id')
      .eq('id', bookingId)
      .single();
    if (!fullBooking) return;
    const { data: customerProfile } = await admin
      .from('customer_profiles')
      .select('user_id')
      .eq('id', fullBooking.customer_id)
      .single();
    if (!customerProfile?.user_id) return;
    await notify({
      recipientUserId: customerProfile.user_id,
      type: 'booking_request_declined',
      title: 'Booking request declined',
      body: `Your request ${fullBooking.booking_number} was declined — you can book another cleaner.`,
      deepLink: `/app/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  })();

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  revalidatePath('/app/cleaner');
  return { ok: true, error: null };
};

export const rescheduleBookingAction = async (
  bookingId: string,
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> => {
  const newStartAt = formData.get('new_start_at') as string | null;
  if (!newStartAt) return { ok: false, error: 'Please select a new date and time.' };

  const newDate = new Date(newStartAt);
  if (isNaN(newDate.getTime())) return { ok: false, error: 'Invalid date.' };
  if (newDate <= new Date()) return { ok: false, error: 'New time must be in the future.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, start_at, end_at, duration_hours_decimal')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (!['booking_requested', 'confirmed'].includes(booking.state)) {
    return { ok: false, error: 'Booking cannot be rescheduled in its current state.' };
  }

  const durationMs = booking.duration_hours_decimal * 60 * 60 * 1000;
  const newEndAt = new Date(newDate.getTime() + durationMs).toISOString();

  const { error } = await supabase
    .from('bookings')
    .update({ start_at: newDate.toISOString(), end_at: newEndAt, state: 'booking_requested' })
    .eq('id', bookingId);

  if (error) return { ok: false, error: error.message };

  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: booking.state,
    new_state: 'booking_requested',
    triggered_by_user_id: user.id,
    reason: `Rescheduled to ${newDate.toISOString()}`,
  });

  revalidatePath(`/app/bookings/${bookingId}`);
  revalidatePath('/app/bookings');
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
    .select('id, state, start_at, total_charge_cents')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  const cancellableStates = ['booking_requested', 'confirmed'];
  if (!cancellableStates.includes(booking.state)) {
    return { ok: false, error: 'Booking cannot be cancelled in its current state.' };
  }

  const policy = calculateCancellationPenalty(
    new Date(booking.start_at),
    booking.total_charge_cents,
  );

  const admin = createSupabaseAdminClient();

  // The booking's PaymentIntent is authorize-only (captured at approval). On
  // cancellation we settle the hold per the policy window: cancel it (full
  // refund), capture only the penalty (partial), or capture in full (no refund).
  const { data: charge } = await admin
    .from('charges')
    .select('id, stripe_payment_intent_id, state')
    .eq('booking_id', bookingId)
    .is('tip_id', null)
    .maybeSingle();

  if (isStripeConfigured() && charge?.stripe_payment_intent_id && charge.state === 'authorized') {
    const now = new Date().toISOString();
    try {
      if (policy.penaltyCents <= 0) {
        await getStripe().paymentIntents.cancel(charge.stripe_payment_intent_id);
        await admin.from('charges').update({ state: 'cancelled' }).eq('id', charge.id);
      } else if (policy.penaltyCents >= booking.total_charge_cents) {
        await getStripe().paymentIntents.capture(charge.stripe_payment_intent_id);
        await admin
          .from('charges')
          .update({ state: 'captured', captured_at: now })
          .eq('id', charge.id);
      } else {
        await getStripe().paymentIntents.capture(charge.stripe_payment_intent_id, {
          amount_to_capture: policy.penaltyCents,
        });
        await admin
          .from('charges')
          .update({ state: 'captured', captured_at: now })
          .eq('id', charge.id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not settle payment on cancellation.';
      return { ok: false, error: msg };
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      state: 'cancelled_by_customer',
      cancelled_at: new Date().toISOString(),
      cancellation_penalty_cents: policy.penaltyCents,
    })
    .eq('id', bookingId);

  if (error) return { ok: false, error: error.message };

  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: booking.state,
    new_state: 'cancelled_by_customer',
    triggered_by_user_id: user.id,
    reason: `Customer cancelled (${policy.tier}: penalty ${policy.penaltyCents}¢, refund ${policy.refundCents}¢).`,
  });

  // Notify the cancelling customer of their refund (the canceller is the customer).
  if (policy.refundCents > 0) {
    void notify({
      recipientUserId: user.id,
      type: 'refund_issued',
      title: 'Cancellation refund issued',
      body: `Your refund of $${(policy.refundCents / 100).toFixed(2)} is being processed.`,
      deepLink: `/app/bookings/${bookingId}`,
    });
  }

  // Notify the assigned cleaner of the cancellation (fire-and-forget)
  void (async () => {
    const { data: fullBooking } = await admin
      .from('bookings')
      .select('booking_number, cleaner_id')
      .eq('id', bookingId)
      .single();
    if (!fullBooking?.cleaner_id) return;
    const { data: cleanerProfile } = await admin
      .from('cleaner_profiles')
      .select('user_id')
      .eq('id', fullBooking.cleaner_id)
      .single();
    if (!cleanerProfile?.user_id) return;
    await notify({
      recipientUserId: cleanerProfile.user_id,
      type: 'booking_cancelled_by_customer',
      title: 'Booking cancelled',
      body: `A customer cancelled booking ${fullBooking.booking_number}.`,
      deepLink: `/app/cleaner/bookings/${bookingId}`,
      relatedBookingId: bookingId,
    });
  })();

  revalidatePath(`/app/bookings/${bookingId}`);
  revalidatePath('/app/bookings');
  return { ok: true, error: null };
};
