import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ScoreSnapshot = {
  snapshot_date: string;
  score: number;
  band: string;
};

export type CustomerReliabilityEvent = {
  id: string;
  event_type: string;
  description: string;
  point_delta: number;
  event_occurred_at: string;
};

export const getMyScoreHistory = async (limit = 30): Promise<ScoreSnapshot[]> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  const { data } = await admin
    .from('reliability_score_snapshots')
    .select('snapshot_date, score, band')
    .eq('cleaner_id', profile.id)
    .order('snapshot_date', { ascending: false })
    .limit(limit);

  return (data ?? []) as ScoreSnapshot[];
};

export const getMyCustomerReliabilityEvents = async (): Promise<CustomerReliabilityEvent[]> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  const { data } = await admin
    .from('customer_reliability_events')
    .select('id, event_type, description, point_delta, event_occurred_at')
    .eq('customer_id', profile.id)
    .order('event_occurred_at', { ascending: false })
    .limit(50);

  return (data ?? []) as CustomerReliabilityEvent[];
};
