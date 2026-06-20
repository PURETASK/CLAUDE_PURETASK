import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type CheckrState = 'pending' | 'in_progress' | 'clear' | 'consider';

export const handleCheckrEvent = async (event: {
  type?: string;
  object?: { id?: string; result?: string; status?: string };
}) => {
  if (!event.object?.id) return;
  const admin = createSupabaseAdminClient();

  // Map Checkr's real report result — never hardcode 'clear'. A 'consider'
  // result means a record was found and an admin must review it; treating it as
  // clear would auto-pass cleaners who failed the check.
  let state: CheckrState = 'in_progress';
  if (event.type === 'report.completed' || event.type === 'report.upgraded') {
    state = event.object.result === 'clear' ? 'clear' : 'consider';
  } else if (event.type === 'report.created' || event.type === 'candidate.created') {
    state = 'pending';
  }

  await admin.from('background_checks').update({ state }).eq('external_check_id', event.object.id);
};
