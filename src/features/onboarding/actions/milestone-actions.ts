'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type MilestoneKey = 'customer_tour' | 'cleaner_tour' | 'photo_training';

export async function completeMilestone(milestone: MilestoneKey): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_milestones').upsert(
    {
      user_id: user.id,
      milestone_key: milestone,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,milestone_key' },
  );
}
