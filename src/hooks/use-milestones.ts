'use client';

import { useEffect, useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { MilestoneKey } from '@/lib/milestones';

export function useMilestone(userId: string | null, key: MilestoneKey): boolean {
  const [completed, setCompleted] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_milestones')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('milestone_key', key)
      .maybeSingle()
      .then(({ data }) => {
        setCompleted(!!data?.completed_at);
      });
  }, [userId, key, supabase]);

  return completed;
}
