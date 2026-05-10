'use server';

import { revalidatePath } from 'next/cache';

import { writeAdminAction } from '@/features/admin/lib/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function adminProcessRefund(
  chargeId: string,
  bookingId: string,
  amountCents: number,
  reasonNotes: string,
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

  if (amountCents <= 0) return { error: null };

  const { data: refund, error: refundErr } = await supabase
    .from('refunds')
    .insert({
      charge_id: chargeId,
      amount_cents: amountCents,
      currency: 'U',
      reason_type: 'goodwill',
      reason_notes: reasonNotes,
      initiated_by_user_id: user.id,
      state: 'pending',
    })
    .select('id')
    .single();
  if (refundErr) return { error: refundErr.message };

  await writeAdminAction(supabase, {
    adminUserId: user.id,
    actionType: 'refund_issued',
    targetBookingId: bookingId,
    targetChargeId: chargeId,
    targetRefundId: refund?.id,
    description: `Refund of $${(amountCents / 100).toFixed(2)} issued`,
    reason: reasonNotes,
    afterState: { amountCents, chargeId, refundId: refund?.id },
  });

  revalidatePath(`/admin/bookings/${bookingId}/refund`);
  return { error: null };
}
