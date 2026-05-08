import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const handleStripeIdentityEvent = async (event: {
  type: string;
  data?: { object?: { id?: string; metadata?: { application_id?: string } } };
}) => {
  if (!event.data?.object?.metadata?.application_id) return;

  const admin = createSupabaseAdminClient();
  const applicationId = event.data.object.metadata.application_id;

  if (event.type === 'identity.verification_session.verified') {
    await admin
      .from('cleaner_applications')
      .update({
        application_data: {
          identity_status: 'verified',
          identity_session_id: event.data.object.id ?? null,
        },
      })
      .eq('id', applicationId);
  }
};
