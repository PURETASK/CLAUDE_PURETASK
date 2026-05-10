'use server';

import { revalidatePath } from 'next/cache';

import { writeAdminAction } from '@/features/admin/lib/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ResolutionType = 'admin_no_refund' | 'admin_partial_refund' | 'admin_refund';

export async function adminResolveDispute(
  disputeId: string,
  resolution: ResolutionType,
  refundCents: number,
  rationale: string,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: me } = await supabase
    .from('users')
    .select('primary_role')
    .eq('id', user.id)
    .single();
  if (me?.primary_role !== 'admin') return { error: 'Admin access required.' };

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, booking_id, state')
    .eq('id', disputeId)
    .single();
  if (!dispute) return { error: 'Dispute not found.' };
  if (dispute.state === 'admin_resolved') return { error: 'Dispute already resolved.' };

  const now = new Date().toISOString();

  const { error: disputeErr } = await supabase
    .from('disputes')
    .update({
      state: 'admin_resolved',
      resolution_type: resolution,
      resolution_amount_cents: refundCents,
      resolution_notes: rationale,
      resolved_at: now,
      resolved_by_admin_id: user.id,
    })
    .eq('id', disputeId);
  if (disputeErr) return { error: disputeErr.message };

  let refundId: string | null = null;

  if (refundCents > 0) {
    const { data: charge } = await supabase
      .from('charges')
      .select('id')
      .eq('booking_id', dispute.booking_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (charge) {
      const { data: refund, error: refundErr } = await supabase
        .from('refunds')
        .insert({
          charge_id: charge.id,
          dispute_id: disputeId,
          amount_cents: refundCents,
          currency: 'U',
          reason_type: 'dispute_resolution',
          reason_notes: rationale,
          initiated_by_user_id: user.id,
          state: 'pending',
        })
        .select('id')
        .single();
      if (refundErr) return { error: refundErr.message };
      refundId = refund?.id ?? null;

      if (refundId) {
        await supabase
          .from('disputes')
          .update({ refund_id: refundId })
          .eq('id', disputeId);
      }
    }
  }

  await writeAdminAction(supabase, {
    adminUserId: user.id,
    actionType: 'dispute_admin_resolved',
    targetDisputeId: disputeId,
    targetBookingId: dispute.booking_id,
    targetRefundId: refundId ?? undefined,
    description: `Dispute resolved: ${resolution}`,
    reason: rationale,
    beforeState: { state: dispute.state },
    afterState: { state: 'admin_resolved', resolution, refundCents },
  });

  revalidatePath(`/admin/disputes/${disputeId}`);
  return { error: null };
}
