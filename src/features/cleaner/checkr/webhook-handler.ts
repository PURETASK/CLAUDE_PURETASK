import { createSupabaseAdminClient } from '@/lib/supabase/admin';

import { mapCheckrReportState } from './state';

export const handleCheckrEvent = async (event: {
  type?: string;
  object?: { id?: string; result?: string; status?: string };
}) => {
  if (!event.object?.id) return;
  const admin = createSupabaseAdminClient();

  const state = mapCheckrReportState(event.type, event.object.result);

  await admin.from('background_checks').update({ state }).eq('external_check_id', event.object.id);
};
