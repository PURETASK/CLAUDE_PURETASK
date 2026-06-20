import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ServiceArea = { cleanerId: string; zips: string[] };

/** The calling cleaner's service-area ZIPs (or null if they have no profile). */
export const getMyServiceArea = async (): Promise<ServiceArea | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return null;

  const { data: rows } = await supabase
    .from('cleaner_service_zips')
    .select('zip_code')
    .eq('cleaner_id', profile.id)
    .order('zip_code');

  return { cleanerId: profile.id, zips: (rows ?? []).map((r) => r.zip_code) };
};
