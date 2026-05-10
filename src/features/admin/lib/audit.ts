import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

type AdminActionType = Database['public']['Enums']['admin_action_type'];

interface AuditParams {
  adminUserId: string;
  actionType: AdminActionType;
  targetUserId?: string;
  targetBookingId?: string;
  targetDisputeId?: string;
  targetChargeId?: string;
  targetRefundId?: string;
  targetApplicationId?: string;
  targetInsuranceId?: string;
  description?: string;
  reason?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function writeAdminAction(
  supabase: SupabaseClient<Database>,
  params: AuditParams,
): Promise<void> {
  await supabase.from('admin_actions').insert({
    admin_user_id: params.adminUserId,
    action_type: params.actionType,
    target_user_id: params.targetUserId ?? null,
    target_booking_id: params.targetBookingId ?? null,
    target_dispute_id: params.targetDisputeId ?? null,
    target_charge_id: params.targetChargeId ?? null,
    target_refund_id: params.targetRefundId ?? null,
    target_application_id: params.targetApplicationId ?? null,
    target_insurance_id: params.targetInsuranceId ?? null,
    description: params.description ?? '',
    reason: params.reason ?? '',
    before_state: (params.beforeState ?? null) as Database['public']['Tables']['admin_actions']['Insert']['before_state'],
    after_state: (params.afterState ?? null) as Database['public']['Tables']['admin_actions']['Insert']['after_state'],
    metadata: (params.metadata ?? null) as Database['public']['Tables']['admin_actions']['Insert']['metadata'],
  });
}
