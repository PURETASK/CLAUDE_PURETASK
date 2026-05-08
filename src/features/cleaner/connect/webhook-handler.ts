import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const handleStripeConnectEvent = async (event: {
  type: string;
  data?: { object?: { id?: string; metadata?: { application_id?: string } } };
}) => {
  const applicationId = event.data?.object?.metadata?.application_id;
  if (!applicationId) return;

  const admin = createSupabaseAdminClient();

  if (event.type === 'account.updated') {
    await admin
      .from('cleaner_applications')
      .update({
        pending_stripe_account_id: event.data?.object?.id ?? null,
        stripe_onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);
  }
};
