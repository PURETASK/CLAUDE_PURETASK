import { createSupabaseServerClient } from '@/lib/supabase/server';

export const getCurrentUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from('users')
    .select('id, full_name, phone, email, timezone, created_at')
    .eq('id', authUser.id)
    .single();

  return data;
};

export const getCustomerProfile = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('id, user_id, default_address_id, photo_policy, skip_photo_rooms, waiver_accepted_at')
    .eq('user_id', authUser.id)
    .single();

  if (error) return null;
  return data;
};

export const getAddresses = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return [];

  const { data } = await supabase
    .from('addresses')
    .select(
      'id, street_1, street_2, city, state, zip_code, label, access_instructions, address_type, country',
    )
    .eq('owner_user_id', authUser.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return data ?? [];
};

// Backward-compatible alias used by existing booking flow pages.
export const getUserAddresses = getAddresses;

export const getAddress = async (addressId: string) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('addresses')
    .select('id, street_1, street_2, city, state, zip_code, label, access_instructions, country')
    .eq('id', addressId)
    .eq('owner_user_id', authUser.id)
    .is('deleted_at', null)
    .single();

  if (error) return null;
  return data;
};
