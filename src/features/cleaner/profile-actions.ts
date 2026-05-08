'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CleanerProfileActionState = { ok: boolean; error: string | null };

export const updateBioAction = async (
  _prev: CleanerProfileActionState,
  formData: FormData,
): Promise<CleanerProfileActionState> => {
  const bio = (formData.get('bio') as string | null)?.trim() ?? '';

  if (bio.length > 1000) {
    return { ok: false, error: 'Bio must be 1000 characters or fewer.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('cleaner_profiles')
    .update({ bio: bio || null })
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/cleaner/settings');
  return { ok: true, error: null };
};
