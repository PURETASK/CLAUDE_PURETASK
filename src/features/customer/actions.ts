'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/lib/supabase/server';

import { addressSchema, photoPolicySchema, updateProfileSchema } from './validation';

export type CustomerActionState = {
  ok: boolean;
  error: string | null;
  message?: string;
};

const normalizePhoneInput = (input: FormDataEntryValue | null): string | undefined => {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (trimmed.startsWith('+')) return trimmed;
  return trimmed;
};

export const updateProfileAction = async (
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> => {
  const parsed = updateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: normalizePhoneInput(formData.get('phone')) || undefined,
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

  revalidatePath('/settings');
  revalidatePath('/settings/profile');
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

  const { data: insertedAddress, error } = await supabase
    .from('addresses')
    .insert({
      owner_user_id: user.id,
      address_type: 'customer_service',
      street_1: parsed.data.street_1,
      street_2: parsed.data.street_2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      zip_code: parsed.data.zip_code,
      country: 'US',
      label: parsed.data.label || null,
      access_instructions: parsed.data.access_instructions || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  const { data: profile, error: profileError } = await supabase
    .from('customer_profiles')
    .select('default_address_id')
    .eq('user_id', user.id)
    .single();

  if (profileError) return { ok: false, error: profileError.message };

  if (!profile.default_address_id) {
    const { error: setDefaultError } = await supabase
      .from('customer_profiles')
      .update({ default_address_id: insertedAddress.id })
      .eq('user_id', user.id);

    if (setDefaultError) return { ok: false, error: setDefaultError.message };
  }

  revalidatePath('/settings/addresses');
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
      country: 'US',
      label: parsed.data.label || null,
      access_instructions: parsed.data.access_instructions || null,
    })
    .eq('id', addressId)
    .eq('owner_user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/settings/addresses');
  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null, message: 'Address updated.' };
};

export const setDefaultAddressAction = async (addressId: string): Promise<CustomerActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('owner_user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (addressError || !address) return { ok: false, error: 'Address not found.' };

  const { error } = await supabase
    .from('customer_profiles')
    .update({ default_address_id: address.id })
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/settings/addresses');
  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null };
};

export const deleteAddressAction = async (addressId: string): Promise<CustomerActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: profile, error: profileError } = await supabase
    .from('customer_profiles')
    .select('default_address_id')
    .eq('user_id', user.id)
    .single();

  if (profileError) return { ok: false, error: profileError.message };

  const { error } = await supabase
    .from('addresses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('owner_user_id', user.id);

  if (error) return { ok: false, error: error.message };

  if (profile.default_address_id === addressId) {
    const { data: nextAddress } = await supabase
      .from('addresses')
      .select('id')
      .eq('owner_user_id', user.id)
      .is('deleted_at', null)
      .neq('id', addressId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { error: setDefaultError } = await supabase
      .from('customer_profiles')
      .update({ default_address_id: nextAddress?.id ?? null })
      .eq('user_id', user.id);

    if (setDefaultError) return { ok: false, error: setDefaultError.message };
  }

  revalidatePath('/settings/addresses');
  revalidatePath('/app/settings/addresses');
  return { ok: true, error: null };
};

export const updatePhotoPolicyAction = async (
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> => {
  const skipPhotoRoomsRaw = formData.get('skip_photo_rooms');
  const otherRoomRaw = formData.get('other_room');
  const baseRooms =
    typeof skipPhotoRoomsRaw === 'string' && skipPhotoRoomsRaw.length > 0
      ? skipPhotoRoomsRaw.split(',').filter(Boolean)
      : [];
  const otherRoom = typeof otherRoomRaw === 'string' ? otherRoomRaw.trim() : '';
  const skipPhotoRooms = otherRoom
    ? [...baseRooms.filter((room) => room !== 'other'), otherRoom]
    : baseRooms;

  const parsed = photoPolicySchema.safeParse({
    photo_policy: formData.get('photo_policy'),
    skip_photo_rooms: skipPhotoRooms,
    waiver_accepted: formData.get('waiver_accepted') === 'true',
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid photo policy selection.',
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('customer_profiles')
    .select('waiver_accepted_at')
    .eq('user_id', user.id)
    .single();

  if (existingProfileError) return { ok: false, error: existingProfileError.message };

  const { error } = await supabase
    .from('customer_profiles')
    .update({
      photo_policy: parsed.data.photo_policy,
      skip_photo_rooms:
        parsed.data.photo_policy === 'skip_named_rooms' ? parsed.data.skip_photo_rooms : [],
      waiver_accepted_at:
        parsed.data.photo_policy === 'skip_all_with_waiver'
          ? new Date().toISOString()
          : (existingProfile?.waiver_accepted_at ?? null),
    })
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/settings/privacy');
  revalidatePath('/app/settings/privacy');
  return { ok: true, error: null, message: 'Photo policy updated.' };
};
