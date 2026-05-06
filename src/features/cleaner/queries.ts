import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ApplicationState = Database['public']['Enums']['application_state'];

export const getMyApplication = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('cleaner_applications')
    .select(
      'id, application_number, state, application_data, home_zip, travel_radius_miles, years_experience, why_puretask_text, submitted_at, rejection_reason, info_request_message, created_at',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  return data;
};

export const getApplicationById = async (id: string) => {
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from('cleaner_applications')
    .select(
      `id, application_number, state, application_data,
       home_zip, travel_radius_miles, years_experience, why_puretask_text,
       submitted_at, decision_at, rejection_reason, info_request_message,
       admin_notes, review_started_at, approved_at,
       user_id,
       users!cleaner_applications_user_id_fkey(full_name, email)`,
    )
    .eq('id', id)
    .single();

  return data;
};

export const listApplications = async (
  states: ApplicationState[] = ['submitted', 'in_review', 'needs_info'],
) => {
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from('cleaner_applications')
    .select(
      `id, application_number, state, submitted_at,
       users!cleaner_applications_user_id_fkey(full_name, email)`,
    )
    .in('state', states)
    .order('submitted_at', { ascending: true });

  return data ?? [];
};
