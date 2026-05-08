'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const getCurrentCustomerId = async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
};

export const toggleFavoriteAction = async (cleanerId: string): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    return;
  }

  const { data: existing, error: lookupError } = await supabase
    .from('customer_favorites')
    .select('id')
    .eq('customer_id', customerId)
    .eq('cleaner_id', cleanerId)
    .maybeSingle();

  if (lookupError) return;

  if (existing?.id) {
    const { error } = await supabase.from('customer_favorites').delete().eq('id', existing.id);
    if (error) return;
  } else {
    const { error } = await supabase.from('customer_favorites').insert({
      customer_id: customerId,
      cleaner_id: cleanerId,
      is_regular: false,
    });
    if (error) return;
  }

  revalidatePath('/app');
  revalidatePath('/app/dashboard');
  revalidatePath('/app/favorites');
  revalidatePath('/app/cleaners');
  revalidatePath(`/app/cleaners/${cleanerId}`);
  return;
};

export const joinWaitlistAction = async (formData: FormData): Promise<void> => {
  const zip = formData.get('zip_code');
  const notes = formData.get('notes');

  if (typeof zip !== 'string' || zip.trim().length < 5) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me, error: meError } = await supabase
    .from('users')
    .select('email, full_name, phone')
    .eq('id', user.id)
    .single();

  if (meError || !me) return;

  const { error } = await supabase.from('waitlist_signups').insert({
    email: me.email,
    full_name: me.full_name,
    phone: me.phone,
    zip_code: zip.trim(),
    notes: typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null,
    status: 'active',
    consent_to_marketing: false,
  });

  if (error) return;

  revalidatePath('/app/waitlist');
  return;
};
