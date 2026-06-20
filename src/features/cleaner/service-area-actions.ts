'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ServiceAreaActionState = { ok: boolean; error: string | null };

const MAX_ZIPS = 60;

export const saveServiceAreaAction = async (
  _prev: ServiceAreaActionState,
  formData: FormData,
): Promise<ServiceAreaActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Cleaner profile not found.' };

  // Parse free-form input (commas / spaces / newlines) into unique 5-digit ZIPs.
  const raw = String(formData.get('zips') ?? '');
  const zips = Array.from(new Set(raw.match(/\d{5}/g) ?? []));
  if (zips.length > MAX_ZIPS)
    return { ok: false, error: `Please list at most ${MAX_ZIPS} ZIP codes.` };

  const admin = createSupabaseAdminClient();
  // Replace the full set so the editor is the source of truth.
  const { error: delErr } = await admin
    .from('cleaner_service_zips')
    .delete()
    .eq('cleaner_id', profile.id);
  if (delErr) return { ok: false, error: delErr.message };

  if (zips.length > 0) {
    const { error: insErr } = await admin
      .from('cleaner_service_zips')
      .insert(zips.map((zip_code) => ({ cleaner_id: profile.id, zip_code })));
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath('/app/cleaner/availability');
  return { ok: true, error: null };
};
