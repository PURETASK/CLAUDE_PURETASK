import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type RecurringScheduleRow = {
  id: string;
  cadence: string;
  day_of_week: number;
  start_minutes: number;
  duration_hours_decimal: number;
  hourly_rate_cents: number;
  status: string;
  started_at: string;
  paused_at: string | null;
  paused_until: string | null;
  ended_at: string | null;
  customer_notes: string | null;
  occurrences_completed_count: number;
  total_charged_cents: number;
  cleaner_name: string;
  service_display_name: string;
  address_street: string;
  cleaner_id: string;
  address_id: string;
  service_id: string;
  customer_id: string;
};

export type OccurrenceRow = {
  id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  status: string;
  booking_id: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  cancelled_at: string | null;
};

export const getMyRecurringSchedules = async (): Promise<RecurringScheduleRow[]> => {
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
    .from('recurring_schedules')
    .select(
      `id, cadence, day_of_week, start_minutes, duration_hours_decimal, hourly_rate_cents,
       status, started_at, paused_at, paused_until, ended_at, customer_notes,
       occurrences_completed_count, total_charged_cents, cleaner_id, address_id, service_id, customer_id,
       cleaner_profiles!recurring_schedules_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       ),
       services!recurring_schedules_service_id_fkey(display_name),
       addresses!recurring_schedules_address_id_fkey(street_1)`,
    )
    .eq('customer_id', profile.id)
    .order('started_at', { ascending: false });

  return (data ?? []).map((row) => {
    const cp = Array.isArray(row.cleaner_profiles) ? row.cleaner_profiles[0] : row.cleaner_profiles;
    const cu = cp
      ? Array.isArray((cp as { users: unknown }).users)
        ? ((cp as { users: { full_name: string }[] }).users[0] ?? null)
        : ((cp as { users: { full_name: string } | null }).users ?? null)
      : null;
    const svc = Array.isArray(row.services) ? row.services[0] : row.services;
    const addr = Array.isArray(row.addresses) ? row.addresses[0] : row.addresses;

    return {
      id: row.id,
      cadence: row.cadence,
      day_of_week: row.day_of_week,
      start_minutes: row.start_minutes,
      duration_hours_decimal: row.duration_hours_decimal,
      hourly_rate_cents: row.hourly_rate_cents,
      status: row.status,
      started_at: row.started_at,
      paused_at: row.paused_at,
      paused_until: row.paused_until,
      ended_at: row.ended_at,
      customer_notes: row.customer_notes,
      occurrences_completed_count: row.occurrences_completed_count,
      total_charged_cents: row.total_charged_cents,
      cleaner_id: row.cleaner_id,
      address_id: row.address_id,
      service_id: row.service_id,
      customer_id: row.customer_id,
      cleaner_name: (cu as { full_name: string } | null)?.full_name ?? 'Cleaner',
      service_display_name: (svc as { display_name: string } | null)?.display_name ?? '—',
      address_street: (addr as { street_1: string } | null)?.street_1 ?? '—',
    };
  });
};

export const getRecurringScheduleById = async (
  id: string,
): Promise<{ schedule: RecurringScheduleRow; occurrences: OccurrenceRow[] } | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return null;

  const { data: row } = await admin
    .from('recurring_schedules')
    .select(
      `id, cadence, day_of_week, start_minutes, duration_hours_decimal, hourly_rate_cents,
       status, started_at, paused_at, paused_until, ended_at, customer_notes,
       occurrences_completed_count, total_charged_cents, cleaner_id, address_id, service_id, customer_id,
       cleaner_profiles!recurring_schedules_cleaner_id_fkey(
         users!cleaner_profiles_user_id_fkey(full_name)
       ),
       services!recurring_schedules_service_id_fkey(display_name),
       addresses!recurring_schedules_address_id_fkey(street_1)`,
    )
    .eq('id', id)
    .eq('customer_id', profile.id)
    .single();
  if (!row) return null;

  const cp = Array.isArray(row.cleaner_profiles) ? row.cleaner_profiles[0] : row.cleaner_profiles;
  const cu = cp
    ? Array.isArray((cp as { users: unknown }).users)
      ? ((cp as { users: { full_name: string }[] }).users[0] ?? null)
      : ((cp as { users: { full_name: string } | null }).users ?? null)
    : null;
  const svc = Array.isArray(row.services) ? row.services[0] : row.services;
  const addr = Array.isArray(row.addresses) ? row.addresses[0] : row.addresses;

  const schedule: RecurringScheduleRow = {
    id: row.id,
    cadence: row.cadence,
    day_of_week: row.day_of_week,
    start_minutes: row.start_minutes,
    duration_hours_decimal: row.duration_hours_decimal,
    hourly_rate_cents: row.hourly_rate_cents,
    status: row.status,
    started_at: row.started_at,
    paused_at: row.paused_at,
    paused_until: row.paused_until,
    ended_at: row.ended_at,
    customer_notes: row.customer_notes,
    occurrences_completed_count: row.occurrences_completed_count,
    total_charged_cents: row.total_charged_cents,
    cleaner_id: row.cleaner_id,
    address_id: row.address_id,
    service_id: row.service_id,
    customer_id: row.customer_id,
    cleaner_name: (cu as { full_name: string } | null)?.full_name ?? 'Cleaner',
    service_display_name: (svc as { display_name: string } | null)?.display_name ?? '—',
    address_street: (addr as { street_1: string } | null)?.street_1 ?? '—',
  };

  const { data: occRows } = await admin
    .from('recurring_occurrences')
    .select(
      'id, scheduled_start_at, scheduled_end_at, status, booking_id, skipped_at, skip_reason, cancelled_at',
    )
    .eq('recurring_schedule_id', id)
    .order('scheduled_start_at');

  const occurrences = (occRows ?? []) as OccurrenceRow[];

  return { schedule, occurrences };
};
