import { createSupabaseServerClient } from '@/lib/supabase/server';

export const getCurrentUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from('users')
    .select('id, full_name, phone, email, timezone')
    .eq('id', authUser.id)
    .single();

  return data;
};

export const getUserAddresses = async () => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('addresses')
    .select(
      'id, street_1, street_2, city, state, zip_code, label, access_instructions, address_type',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return data ?? [];
};
