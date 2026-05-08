import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const handleCheckrEvent = async (event: { object?: { id?: string }; type?: string }) => {
  if (!event.object?.id) return;
  const admin = createSupabaseAdminClient();

  await admin
    .from('background_checks')
    .update({
      external_check_id: event.object.id,
      state: event.type === 'report.completed' ? 'clear' : 'in_progress',
    })
    .eq('external_check_id', event.object.id);
};
