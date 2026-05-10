'use server';

import { revalidatePath } from 'next/cache';

import { getMyCleanerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function uploadInsuranceDocument(
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) return { error: 'Cleaner profile not found.' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Please select a file to upload.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be under 10 MB.' };

  const storageKey = `certificates/${cleanerProfileId}/coi_${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(storageKey, file, { contentType: 'application/pdf', upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from('insurance_policies').insert({
    cleaner_id: cleanerProfileId,
    document_storage_key: storageKey,
    state: 'uploaded',
  });

  if (error) return { error: error.message };

  revalidatePath('/cleaner/settings/insurance');
  return { error: null };
}
