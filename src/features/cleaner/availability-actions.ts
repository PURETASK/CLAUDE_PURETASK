'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AvailabilityActionState = { ok: boolean; error: string | null };

export type DayRule = {
  day_of_week: number;
  is_active: boolean;
  start_minutes: number;
  end_minutes: number;
};

export const saveAvailabilityAction = async (
  rules: DayRule[],
): Promise<AvailabilityActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Cleaner profile not found.' };

  await admin.from('availability_rules').delete().eq('cleaner_id', profile.id);

  const { error } = await admin.from('availability_rules').insert(
    rules.map((r) => ({
      cleaner_id: profile.id,
      day_of_week: r.day_of_week,
      is_active: r.is_active,
      start_minutes: r.start_minutes,
      end_minutes: r.end_minutes,
    })),
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/cleaner/availability');
  return { ok: true, error: null };
};

export const addTimeOffAction = async (formData: FormData): Promise<void> => {
  const start = formData.get('start_date') as string | null;
  const end = formData.get('end_date') as string | null;
  const reason = (formData.get('reason') as string | null)?.trim() || null;

  if (!start || !end) return;
  if (new Date(start) > new Date(end)) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return;

  await admin.from('time_off_blocks').insert({
    cleaner_id: profile.id,
    block_type: 'personal',
    blocked_start_at: new Date(start + 'T00:00:00').toISOString(),
    blocked_end_at: new Date(end + 'T23:59:59').toISOString(),
    reason,
  });

  revalidatePath('/app/cleaner/availability');
};

export const removeTimeOffAction = async (blockId: string): Promise<AvailabilityActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { ok: false, error: 'Cleaner profile not found.' };

  const { error } = await admin
    .from('time_off_blocks')
    .delete()
    .eq('id', blockId)
    .eq('cleaner_id', profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/cleaner/availability');
  return { ok: true, error: null };
};
