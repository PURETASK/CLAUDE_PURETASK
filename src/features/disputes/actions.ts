'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { stripe } from '@/lib/stripe/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { adminResolveSchema, cleanerRespondSchema, fileDisputeSchema } from './validation';

export type DisputeActionState = { ok: boolean; error: string | null };

export const markJobCompleteAction = async (bookingId: string): Promise<DisputeActionState> => {
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
  if (booking.state !== 'confirmed')
    return { ok: false, error: 'Job can only be marked complete from confirmed state.' };

  const { error } = await supabase
    .from('bookings')
    .update({ state: 'awaiting_approval' })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  const admin = createSupabaseAdminClient();
  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'confirmed',
    new_state: 'awaiting_approval',
    triggered_by_user_id: user.id,
    reason: 'Cleaner marked job complete.',
  });

  revalidatePath(`/app/cleaner/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const approveBookingAction = async (bookingId: string): Promise<DisputeActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, state, cleaner_id, cleaner_payout_cents, booking_number')
    .eq('id', bookingId)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };
  if (booking.state !== 'awaiting_approval')
    return { ok: false, error: 'Booking is not awaiting approval.' };

  const admin = createSupabaseAdminClient();

  // Capture the Stripe PaymentIntent if one exists
  const { data: charge } = await admin
    .from('charges')
    .select('id, stripe_payment_intent_id, state')
    .eq('booking_id', bookingId)
    .is('tip_id', null)
    .maybeSingle();

  const now = new Date().toISOString();

  if (charge?.stripe_payment_intent_id && charge.state === 'authorized') {
    try {
      await stripe.paymentIntents.capture(charge.stripe_payment_intent_id);
      await admin
        .from('charges')
        .update({ state: 'captured', captured_at: now })
        .eq('id', charge.id);
    } catch {
      // Non-fatal: capture failure should not block approval; admin handles manually
    }
  }

  const disputeWindowEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('bookings')
    .update({
      state: 'paid',
      customer_approved_at: now,
      dispute_window_ends_at: disputeWindowEndsAt,
    })
    .eq('id', bookingId);
  if (error) return { ok: false, error: error.message };

  await admin.from('booking_state_events').insert({
    booking_id: bookingId,
    previous_state: 'awaiting_approval',
    new_state: 'paid',
    triggered_by_user_id: user.id,
    reason: 'Customer approved completed work.',
  });

  // Create payout line item for the cleaner
  if (booking.cleaner_payout_cents > 0 && booking.cleaner_id) {
    await admin.from('payout_line_items').insert({
      cleaner_id: booking.cleaner_id,
      booking_id: bookingId,
      amount_cents: booking.cleaner_payout_cents,
      description: `Earnings from booking ${booking.booking_number}`,
      earned_at: now,
      currency: 'usd',
      is_instant: false,
    });
  }

  revalidatePath(`/app/bookings/${bookingId}`);
  return { ok: true, error: null };
};

export const fileDisputeAction = async (
  _prevState: DisputeActionState,
  formData: FormData,
): Promise<DisputeActionState> => {
  const parsed = fileDisputeSchema.safeParse({
    booking_id: formData.get('booking_id'),
    issue_category: formData.get('issue_category'),
    customer_desired_outcome: formData.get('customer_desired_outcome'),
    customer_description: formData.get('customer_description'),
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

  const { data: booking } = await admin
    .from('bookings')
    .select('id, state, cleaner_id, dispute_window_ends_at')
    .eq('id', parsed.data.booking_id)
    .eq('customer_id', customerProfile.id)
    .single();

  if (!booking) return { ok: false, error: 'Booking not found.' };

  const disputeableStates = ['approved', 'auto_approved', 'paid'];
  if (!disputeableStates.includes(booking.state))
    return { ok: false, error: 'This booking cannot be disputed in its current state.' };

  if (booking.dispute_window_ends_at && new Date(booking.dispute_window_ends_at) < new Date()) {
    return { ok: false, error: 'The 48-hour dispute window has closed.' };
  }

  if (!booking.cleaner_id) return { ok: false, error: 'No cleaner assigned to this booking.' };

  const { data: existing } = await admin
    .from('disputes')
    .select('id')
    .eq('booking_id', parsed.data.booking_id)
    .maybeSingle();
  if (existing) return { ok: false, error: 'A dispute has already been filed for this booking.' };

  const cleanerResponseDueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: dispute, error: disputeError } = await supabase
    .from('disputes')
    .insert({
      booking_id: parsed.data.booking_id,
      customer_id: customerProfile.id,
      cleaner_id: booking.cleaner_id,
      issue_category: parsed.data.issue_category,
      customer_desired_outcome: parsed.data.customer_desired_outcome,
      customer_description: parsed.data.customer_description,
      cleaner_response_due_at: cleanerResponseDueAt,
    })
    .select('id')
    .single();

  if (disputeError || !dispute)
    return { ok: false, error: disputeError?.message ?? 'Failed to file dispute.' };

  await supabase.from('bookings').update({ state: 'disputed' }).eq('id', parsed.data.booking_id);

  await admin.from('booking_state_events').insert({
    booking_id: parsed.data.booking_id,
    previous_state: booking.state,
    new_state: 'disputed',
    triggered_by_user_id: user.id,
    reason: 'Customer filed a dispute.',
  });

  await supabase.from('dispute_messages').insert({
    dispute_id: dispute.id,
    sender_user_id: user.id,
    sender_role: 'customer',
    body: parsed.data.customer_description,
    triggered_state_change: true,
  });

  redirect(`/app/bookings/${parsed.data.booking_id}/dispute`);
};

export const cleanerRespondAction = async (
  _prevState: DisputeActionState,
  formData: FormData,
): Promise<DisputeActionState> => {
  const parsed = cleanerRespondSchema.safeParse({
    dispute_id: formData.get('dispute_id'),
    response_type: formData.get('response_type'),
    response_message: formData.get('response_message'),
    response_amount_cents: formData.get('response_amount_cents')
      ? Number(formData.get('response_amount_cents'))
      : undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, state, booking_id')
    .eq('id', parsed.data.dispute_id)
    .single();

  if (!dispute) return { ok: false, error: 'Dispute not found.' };
  if (dispute.state !== 'open')
    return { ok: false, error: 'This dispute is not open for a response.' };

  const { error } = await supabase
    .from('disputes')
    .update({
      state: 'cleaner_responded',
      cleaner_response_type: parsed.data.response_type,
      cleaner_response_message: parsed.data.response_message,
      cleaner_response_amount_cents: parsed.data.response_amount_cents ?? null,
      cleaner_responded_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.dispute_id);

  if (error) return { ok: false, error: error.message };

  await supabase.from('dispute_messages').insert({
    dispute_id: parsed.data.dispute_id,
    sender_user_id: user.id,
    sender_role: 'cleaner',
    body: parsed.data.response_message,
    triggered_state_change: true,
  });

  revalidatePath(`/app/cleaner/bookings/${dispute.booking_id}/dispute`);
  return { ok: true, error: null };
};

export const customerAcceptResolutionAction = async (
  disputeId: string,
): Promise<DisputeActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, state, booking_id, cleaner_response_type, cleaner_response_amount_cents')
    .eq('id', disputeId)
    .single();

  if (!dispute) return { ok: false, error: 'Dispute not found.' };
  if (dispute.state !== 'cleaner_responded')
    return { ok: false, error: 'No cleaner response to accept.' };

  const resolutionType =
    dispute.cleaner_response_type === 'offer_reclean'
      ? 'mutual_reclean_completed'
      : dispute.cleaner_response_type === 'offer_partial_refund'
        ? 'mutual_refund'
        : 'mutual_no_action';

  const { error } = await supabase
    .from('disputes')
    .update({
      state: 'mutually_resolved',
      resolved_at: new Date().toISOString(),
      resolution_type: resolutionType,
      resolution_amount_cents: dispute.cleaner_response_amount_cents ?? null,
    })
    .eq('id', disputeId);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from('bookings')
    .update({ state: 'dispute_resolved' })
    .eq('id', dispute.booking_id);

  revalidatePath(`/app/bookings/${dispute.booking_id}/dispute`);
  return { ok: true, error: null };
};

export const customerRejectResolutionAction = async (
  disputeId: string,
): Promise<DisputeActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, state, booking_id')
    .eq('id', disputeId)
    .single();

  if (!dispute) return { ok: false, error: 'Dispute not found.' };
  if (dispute.state !== 'cleaner_responded')
    return { ok: false, error: 'No cleaner response to reject.' };

  const { error } = await supabase
    .from('disputes')
    .update({
      state: 'escalated',
      escalated_at: new Date().toISOString(),
      escalated_by_role: 'customer',
    })
    .eq('id', disputeId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/bookings/${dispute.booking_id}/dispute`);
  return { ok: true, error: null };
};

export const adminResolveDisputeAction = async (
  _prevState: DisputeActionState,
  formData: FormData,
): Promise<DisputeActionState> => {
  const parsed = adminResolveSchema.safeParse({
    dispute_id: formData.get('dispute_id'),
    resolution_type: formData.get('resolution_type'),
    resolution_notes: formData.get('resolution_notes'),
    resolution_amount_cents: formData.get('resolution_amount_cents')
      ? Number(formData.get('resolution_amount_cents'))
      : undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();

  const { data: dispute } = await admin
    .from('disputes')
    .select('id, state, booking_id')
    .eq('id', parsed.data.dispute_id)
    .single();

  if (!dispute) return { ok: false, error: 'Dispute not found.' };

  const resolvableStates = ['open', 'cleaner_responded', 'escalated', 'in_mediation'];
  if (!resolvableStates.includes(dispute.state))
    return { ok: false, error: 'Dispute cannot be resolved in its current state.' };

  const { error } = await admin
    .from('disputes')
    .update({
      state: 'admin_resolved',
      resolved_at: new Date().toISOString(),
      resolution_type: parsed.data.resolution_type,
      resolution_notes: parsed.data.resolution_notes,
      resolution_amount_cents: parsed.data.resolution_amount_cents ?? null,
      resolved_by_admin_id: user.id,
    })
    .eq('id', parsed.data.dispute_id);

  if (error) return { ok: false, error: error.message };

  await admin.from('dispute_messages').insert({
    dispute_id: parsed.data.dispute_id,
    sender_user_id: user.id,
    sender_role: 'admin',
    body: `Admin resolution: ${parsed.data.resolution_notes}`,
    triggered_state_change: true,
  });

  await admin.from('bookings').update({ state: 'dispute_resolved' }).eq('id', dispute.booking_id);

  revalidatePath('/app/admin/disputes');
  revalidatePath(`/app/admin/disputes/${parsed.data.dispute_id}`);
  redirect('/app/admin/disputes');
};
