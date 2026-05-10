'use server';

import { revalidatePath } from 'next/cache';

import { encryptTaxId } from '@/lib/encryption';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function saveTaxInfo(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const ssn = (formData.get('ssn') as string | null) ?? '';
  const taxIdType = (formData.get('tax_id_type') as string | null) ?? '';

  const cleaned = ssn.replace(/-/g, '');
  if (!/^\d{9}$/.test(cleaned)) return { error: 'Please enter a valid 9-digit SSN.' };
  if (!taxIdType) return { error: 'Please select a tax classification.' };

  const encrypted = encryptTaxId(cleaned);

  const { error } = await supabase
    .from('cleaner_profiles')
    .update({
      encrypted_tax_id: encrypted,
      tax_id_type: taxIdType,
    })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/cleaner/settings/tax');
  return { error: null };
}
