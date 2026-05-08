'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export type RecurringActionState = { ok: boolean; error: string | null };

type RecurringCadence = Database['public']['Enums']['recurring_cadence'];
type OccurrenceInsert = Database['public']['Tables']['recurring_occurrences']['Insert'];

const CADENCE_DAYS: Record<string, number> = {
  every_week: 7,
  every_2_weeks: 14,
  every_4_weeks: 28,
  every_8_weeks: 56,
  every_12_weeks: 84,
};

const MAX_OCCURRENCES = 52;

function generateOccurrences(
  scheduleId: string,
  firstStart: Date,
  durationHours: number,
  cadence: string,
): OccurrenceInsert[] {
  const intervalDays = CADENCE_DAYS[cadence] ?? 7;
  const durationMs = durationHours * 60 * 60 * 1000;
  const sixMonthsOut = new Date(Date.now() + 183 * 24 * 60 * 60 * 1000);
  const occurrences: OccurrenceInsert[] = [];

  let current = new Date(firstStart);
  let count = 0;

  while (current <= sixMonthsOut && count < MAX_OCCURRENCES) {
    occurrences.push({
      recurring_schedule_id: scheduleId,
      scheduled_start_at: current.toISOString(),
      scheduled_end_at: new Date(current.getTime() + durationMs).toISOString(),
      status: 'scheduled',
    });
    current = new Date(current.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    count++;
  }

  return occurrences;
}

export const createRecurringScheduleAction = async (
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> => {
  const cleanerId = formData.get('cleaner_id') as string | null;
  const serviceId = formData.get('service_id') as string | null;
  const addressId = formData.get('address_id') as string | null;
  const cadence = formData.get('cadence') as string | null;
  const firstDate = formData.get('first_date') as string | null;
  const startMinutesRaw = formData.get('start_minutes') as string | null;
  const durationRaw = formData.get('duration_hours') as string | null;
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  if (
    !cleanerId ||
    !serviceId ||
    !addressId ||
    !cadence ||
    !firstDate ||
    !startMinutesRaw ||
    !durationRaw
  ) {
    return { ok: false, error: 'All fields are required.' };
  }

  const startMinutes = parseInt(startMinutesRaw, 10);
  const durationHours = parseFloat(durationRaw);

  if (!(cadence in CADENCE_DAYS)) return { ok: false, error: 'Invalid cadence.' };
  if (durationHours < 1 || durationHours > 8)
    return { ok: false, error: 'Duration must be 1–8 hours.' };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();

  const { data: customerProfile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!customerProfile) return { ok: false, error: 'Customer profile not found.' };

  const { data: cleaner } = await admin
    .from('cleaner_profiles')
    .select('id, hourly_rates_cents')
    .eq('id', cleanerId)
    .single();
  if (!cleaner) return { ok: false, error: 'Cleaner not found.' };

  const { data: service } = await admin
    .from('services')
    .select('id, service_type')
    .eq('id', serviceId)
    .single();
  if (!service) return { ok: false, error: 'Service not found.' };

  const rates = cleaner.hourly_rates_cents as Record<string, number>;
  const hourlyRate = rates[service.service_type] ?? 0;
  if (!hourlyRate) return { ok: false, error: 'Cleaner does not offer this service.' };

  // Build first occurrence datetime
  const dateParts = firstDate.split('-').map(Number);
  const year = dateParts[0] ?? 2025;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const startHour = Math.floor(startMinutes / 60);
  const startMin = startMinutes % 60;
  const firstStart = new Date(year, month - 1, day, startHour, startMin, 0, 0);

  if (firstStart <= new Date()) return { ok: false, error: 'First date must be in the future.' };

  const dayOfWeek = firstStart.getDay();

  const { data: schedule, error: schedErr } = await admin
    .from('recurring_schedules')
    .insert({
      customer_id: customerProfile.id,
      cleaner_id: cleanerId,
      service_id: serviceId,
      address_id: addressId,
      cadence: cadence as RecurringCadence,
      day_of_week: dayOfWeek,
      start_minutes: startMinutes,
      duration_hours_decimal: durationHours,
      hourly_rate_cents: hourlyRate,
      customer_notes: notes,
      started_at: firstStart.toISOString(),
      status: 'active',
    })
    .select('id')
    .single();

  if (schedErr || !schedule)
    return { ok: false, error: schedErr?.message ?? 'Failed to create schedule.' };

  const occurrences = generateOccurrences(schedule.id, firstStart, durationHours, cadence);
  await admin.from('recurring_occurrences').insert(occurrences);

  redirect(`/app/recurring/${schedule.id}`);
};

export const skipOccurrenceAction = async (
  occurrenceId: string,
  reason?: string,
): Promise<RecurringActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();

  // Verify ownership via schedule → customer_profile
  const { data: occ } = await admin
    .from('recurring_occurrences')
    .select(
      'id, status, recurring_schedule_id, recurring_schedules!recurring_occurrences_recurring_schedule_id_fkey(customer_id, customer_profiles!recurring_schedules_customer_id_fkey(user_id))',
    )
    .eq('id', occurrenceId)
    .single();

  if (!occ) return { ok: false, error: 'Occurrence not found.' };
  if (occ.status !== 'scheduled')
    return { ok: false, error: 'Only scheduled occurrences can be skipped.' };

  const { error } = await admin
    .from('recurring_occurrences')
    .update({
      status: 'skipped',
      skipped_at: new Date().toISOString(),
      skip_reason: reason ?? null,
    })
    .eq('id', occurrenceId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/recurring`);
  return { ok: true, error: null };
};

export const pauseScheduleAction = async (scheduleId: string): Promise<RecurringActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Not found.' };

  const { error } = await admin
    .from('recurring_schedules')
    .update({ status: 'paused', paused_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .eq('customer_id', profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/recurring/${scheduleId}`);
  return { ok: true, error: null };
};

export const resumeScheduleAction = async (scheduleId: string): Promise<RecurringActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Not found.' };

  const { error } = await admin
    .from('recurring_schedules')
    .update({ status: 'active', paused_at: null, paused_until: null })
    .eq('id', scheduleId)
    .eq('customer_id', profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/recurring/${scheduleId}`);
  return { ok: true, error: null };
};

export const endScheduleAction = async (scheduleId: string): Promise<RecurringActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Not found.' };

  const now = new Date().toISOString();
  const { error } = await admin
    .from('recurring_schedules')
    .update({ status: 'ended_by_customer', ended_at: now, ended_reason: 'Cancelled by customer.' })
    .eq('id', scheduleId)
    .eq('customer_id', profile.id);

  if (error) return { ok: false, error: error.message };

  // Cancel future scheduled occurrences
  await admin
    .from('recurring_occurrences')
    .update({ status: 'cancelled', cancelled_at: now })
    .eq('recurring_schedule_id', scheduleId)
    .eq('status', 'scheduled');

  revalidatePath(`/app/recurring`);
  redirect('/app/recurring');
};
