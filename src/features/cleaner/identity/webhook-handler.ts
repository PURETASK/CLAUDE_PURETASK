import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const STATUS_BY_EVENT: Record<string, string> = {
  'identity.verification_session.verified': 'verified',
  'identity.verification_session.requires_input': 'requires_input',
  'identity.verification_session.processing': 'processing',
  'identity.verification_session.canceled': 'canceled',
};

export const handleStripeIdentityEvent = async (event: {
  type: string;
  data?: { object?: { id?: string; metadata?: { application_id?: string } } };
}) => {
  if (!event.data?.object?.metadata?.application_id) return;

  const status = STATUS_BY_EVENT[event.type];
  if (!status) return;

  const admin = createSupabaseAdminClient();
  const applicationId = event.data.object.metadata.application_id;

  // MERGE into application_data — do NOT overwrite the whole JSONB, or the
  // multi-step application draft (home_zip, experience, tax info, …) is wiped.
  const { data: app } = await admin
    .from('cleaner_applications')
    .select('application_data')
    .eq('id', applicationId)
    .single();

  const merged = {
    ...((app?.application_data ?? {}) as Record<string, unknown>),
    identity_status: status,
    identity_session_id: event.data.object.id ?? null,
  };

  await admin
    .from('cleaner_applications')
    .update({ application_data: merged })
    .eq('id', applicationId);
};
