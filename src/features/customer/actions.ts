'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import { addressSchema, updateProfileSchema } from './validation';

export type CustomerActionState = {
  ok: boolean;
  error: string | null;
  message?: string;
};

export const updateProfileAction = async (
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> => {
  const parsed = updateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq('id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/settings');
  return { ok: true, error: null, message: 'Profile updated.' };
};

export const addAddressAction = async (
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> => {
  const parsed = addressSchema.safeParse({
    label: formData.get('label') || undefined,
    street_1: formData.get('street_1'),
    street_2: formData.get('street_2') || undefined,
    city: formData.get('city'),
    state: formData.get('state'),
    zip_code: formData.get('zip_code'),
    access_instructions: formData.get('access_instructions') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid address.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase.from('addresses').insert({
    owner_user_id: user.id,
    address_type: 'customer_service',
    street_1: parsed.data.street_1,
    street_2: parsed.data.street_2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    zip_code: parsed.data.zip_code,
    label: parsed.data.label || null,
    access_instructions: parsed.data.access_instructions || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null, message: 'Address added.' };
};

export const updateAddressAction = async (
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> => {
  const addressId = formData.get('address_id');
  if (!addressId || typeof addressId !== 'string') {
    return { ok: false, error: 'Missing address ID.' };
  }

  const parsed = addressSchema.safeParse({
    label: formData.get('label') || undefined,
    street_1: formData.get('street_1'),
    street_2: formData.get('street_2') || undefined,
    city: formData.get('city'),
    state: formData.get('state'),
    zip_code: formData.get('zip_code'),
    access_instructions: formData.get('access_instructions') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid address.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('addresses')
    .update({
      street_1: parsed.data.street_1,
      street_2: parsed.data.street_2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      zip_code: parsed.data.zip_code,
      label: parsed.data.label || null,
      access_instructions: parsed.data.access_instructions || null,
    })
    .eq('id', addressId)
    .eq('owner_user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null, message: 'Address updated.' };
};

export const deleteAddressAction = async (addressId: string): Promise<CustomerActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('addresses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('owner_user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null };
};
