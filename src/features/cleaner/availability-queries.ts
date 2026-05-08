import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AvailabilityRule = {
  id: string;
  day_of_week: number;
  start_minutes: number;
  end_minutes: number;
  is_active: boolean;
};

export type TimeOffBlock = {
  id: string;
  block_type: string;
  blocked_start_at: string;
  blocked_end_at: string;
  reason: string | null;
};

export const getMyAvailability = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return null;

  const [{ data: rules }, { data: timeOff }] = await Promise.all([
    admin
      .from('availability_rules')
      .select('id, day_of_week, start_minutes, end_minutes, is_active')
      .eq('cleaner_id', profile.id)
      .order('day_of_week'),
    admin
      .from('time_off_blocks')
      .select('id, block_type, blocked_start_at, blocked_end_at, reason')
      .eq('cleaner_id', profile.id)
      .gte('blocked_end_at', new Date().toISOString())
      .order('blocked_start_at'),
  ]);

  return {
    cleanerId: profile.id,
    rules: (rules ?? []) as AvailabilityRule[],
    timeOff: (timeOff ?? []) as TimeOffBlock[],
  };
};
