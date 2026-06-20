'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { writeAdminAction } from '@/features/admin/lib/audit';
import { settleApprovedBooking } from '@/features/booking/lib/settle-approval';
import { sendEmail } from '@/lib/email/resend';
import {
  awaitingApprovalEmail,
  disputeFiledEmail,
  disputeResponseEmail,
  payoutInitiatedEmail,
} from '@/lib/email/templates';
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

  // Notify customer to approve (fire-and-forget)
  void (async () => {
    const { data: fullBooking } = await admin
      .from('bookings')
      .select('booking_number, customer_id, cleaner_id')
      .eq('id', bookingId)
      .single();
    if (!fullBooking) return;
    const [{ data: custProfile }, { data: cleanerProfile }] = await Promise.all([
      admin.from('customer_profiles').select('user_id').eq('id', fullBooking.customer_id).single(),
      admin
        .from('cleaner_profiles')
        .select('user_id')
        .eq('id', fullBooking.cleaner_id ?? '')
        .single(),
    ]);
    const [{ data: custUser }, { data: cleanerUser }] = await Promise.all([
      admin
        .from('users')
        .select('email, full_name')
        .eq('id', custProfile?.user_id ?? '')
        .single(),
      admin
        .from('users')
        .select('full_name')
        .eq('id', cleanerProfile?.user_id ?? '')
        .single(),
    ]);
    if (custUser?.email) {
      const tmpl = awaitingApprovalEmail({
        customerName: custUser.full_name ?? 'Customer',
        cleanerName: cleanerUser?.full_name ?? 'Your cleaner',
        bookingNumber: fullBooking.booking_number,
        bookingId,
      });
      await sendEmail({ to: custUser.email, ...tmpl });
    }
  })();

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
  const result = await settleApprovedBooking(admin, {
    bookingId,
    newState: 'paid',
    actorUserId: user.id,
    reason: 'Customer approved completed work.',
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/app/bookings/${bookingId}`);
  redirect(`/app/bookings/${bookingId}/tip`);
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

  // Notify cleaner a dispute was filed (fire-and-forget)
  void (async () => {
    const [{ data: cleanerProfile }, { data: custUser }] = await Promise.all([
      admin.from('cleaner_profiles').select('user_id').eq('id', booking.cleaner_id!).single(),
      admin.from('users').select('full_name').eq('id', user.id).single(),
    ]);
    const { data: cleanerUser } = await admin
      .from('users')
      .select('email, full_name')
      .eq('id', cleanerProfile?.user_id ?? '')
      .single();
    if (cleanerUser?.email) {
      const { data: bk } = await admin
        .from('bookings')
        .select('booking_number')
        .eq('id', parsed.data.booking_id)
        .single();
      await sendEmail({
        to: cleanerUser.email,
        ...disputeFiledEmail({
          cleanerName: cleanerUser.full_name ?? 'Cleaner',
          customerName: custUser?.full_name ?? 'Customer',
          bookingNumber: bk?.booking_number ?? '',
          issueCategory: parsed.data.issue_category.replace(/_/g, ' '),
          disputeBookingId: parsed.data.booking_id,
        }),
      });
    }
  })();

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

  // Notify customer of cleaner response (fire-and-forget)
  void (async () => {
    const admin = createSupabaseAdminClient();
    const { data: bkData } = await admin
      .from('bookings')
      .select('booking_number, customer_id')
      .eq('id', dispute.booking_id)
      .single();
    if (!bkData) return;
    const { data: custProfile } = await admin
      .from('customer_profiles')
      .select('user_id')
      .eq('id', bkData.customer_id)
      .single();
    const [{ data: custUser }, { data: cleanerUser }] = await Promise.all([
      admin
        .from('users')
        .select('email, full_name')
        .eq('id', custProfile?.user_id ?? '')
        .single(),
      admin.from('users').select('full_name').eq('id', user.id).single(),
    ]);
    if (custUser?.email) {
      await sendEmail({
        to: custUser.email,
        ...disputeResponseEmail({
          customerName: custUser.full_name ?? 'Customer',
          cleanerName: cleanerUser?.full_name ?? 'Your cleaner',
          bookingNumber: bkData.booking_number,
          responseType: parsed.data.response_type.replace(/_/g, ' '),
          bookingId: dispute.booking_id,
        }),
      });
    }
  })();

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

  // When the resolution awards a refund, create the refunds row and link it
  // back to the dispute so finance/audit can trace the money trail.
  const refundCents = parsed.data.resolution_amount_cents ?? 0;
  let refundId: string | null = null;
  if (refundCents > 0) {
    const { data: charge } = await admin
      .from('charges')
      .select('id')
      .eq('booking_id', dispute.booking_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (charge) {
      const { data: refund, error: refundErr } = await admin
        .from('refunds')
        .insert({
          charge_id: charge.id,
          dispute_id: parsed.data.dispute_id,
          amount_cents: refundCents,
          currency: 'usd',
          reason_type: 'dispute_resolution',
          reason_notes: parsed.data.resolution_notes,
          initiated_by_user_id: user.id,
          state: 'pending',
        })
        .select('id')
        .single();
      if (!refundErr && refund) {
        refundId = refund.id;
        await admin
          .from('disputes')
          .update({ refund_id: refundId })
          .eq('id', parsed.data.dispute_id);
      }
    }
  }

  await writeAdminAction(admin, {
    adminUserId: user.id,
    actionType: 'dispute_admin_resolved',
    targetDisputeId: parsed.data.dispute_id,
    targetBookingId: dispute.booking_id,
    targetRefundId: refundId ?? undefined,
    description: `Dispute resolved: ${parsed.data.resolution_type}`,
    reason: parsed.data.resolution_notes,
    beforeState: { state: dispute.state },
    afterState: {
      state: 'admin_resolved',
      resolution: parsed.data.resolution_type,
      refundCents,
    },
  });

  revalidatePath('/admin/disputes');
  revalidatePath(`/admin/disputes/${parsed.data.dispute_id}`);
  redirect('/admin/disputes');
};
