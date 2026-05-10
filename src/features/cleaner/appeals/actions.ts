'use server';

import { revalidatePath } from 'next/cache';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function submitAppeal(
  targetType: 'tier_drop' | 'reliability_event',
  appealText: string,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) return { error: 'Cleaner profile not found.' };

  if (!appealText.trim() || appealText.trim().length < 20) {
    return { error: 'Please provide a detailed explanation (at least 20 characters).' };
  }

  const now = new Date();
  const reviewDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from('cleaner_appeals').insert({
    cleaner_id: cleanerProfileId,
    target_type: targetType,
    appeal_text: appealText.trim(),
    status: 'pending',
    submitted_at: now.toISOString(),
    review_due_at: reviewDue.toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath('/cleaner/score/appeal');
  return { error: null };
}
