'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

import { step1Schema, step2Schema, step3Schema, step4Schema } from './validation';

export type CleanerActionState = {
  ok: boolean;
  error: string | null;
  message?: string;
};

const generateApplicationNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${date}-${rand}`;
};

export const createDraftAction = async (): Promise<never> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/sign-in');

  await supabase.from('cleaner_applications').insert({
    user_id: user.id,
    application_number: generateApplicationNumber(),
    state: 'draft',
    application_data: {},
  });

  redirect('/app/apply/step/1');
};

const STEP_SCHEMAS = {
  '1': step1Schema,
  '2': step2Schema,
  '3': step3Schema,
  '4': step4Schema,
} as const;

const NEXT_STEP: Record<string, string> = {
  '1': '2',
  '2': '3',
  '3': '4',
  '4': '5',
};

export const saveStepAction = async (
  step: string,
  _prevState: CleanerActionState,
  formData: FormData,
): Promise<CleanerActionState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  let stepData: Record<string, unknown>;

  if (step === '1') {
    const parsed = step1Schema.safeParse({
      home_zip: formData.get('home_zip'),
      travel_radius_miles: Number(formData.get('travel_radius_miles')),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };
    stepData = parsed.data;
  } else if (step === '2') {
    const parsed = step2Schema.safeParse({
      years_experience: Number(formData.get('years_experience')),
      service_types: formData.getAll('service_types'),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };
    stepData = parsed.data;
  } else if (step === '3') {
    const parsed = step3Schema.safeParse({
      why_puretask_text: formData.get('why_puretask_text'),
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };
    stepData = parsed.data;
  } else if (step === '4') {
    const parsed = step4Schema.safeParse({
      etiquette_acknowledged: formData.get('etiquette_acknowledged') === 'true',
    });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' };
    stepData = parsed.data;
  } else {
    return { ok: false, error: 'Invalid step.' };
  }

  const { data: app } = await supabase
    .from('cleaner_applications')
    .select('application_data')
    .eq('user_id', user.id)
    .eq('state', 'draft')
    .single();

  if (!app) return { ok: false, error: 'No active application found.' };

  const merged = { ...(app.application_data as Record<string, unknown>), ...stepData };

  const { error } = await supabase
    .from('cleaner_applications')
    .update({ application_data: merged as Json })
    .eq('user_id', user.id)
    .eq('state', 'draft');

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/apply/step/${NEXT_STEP[step] ?? step}`);
  return { ok: true, error: null, message: `Step ${step} saved.` };
};

export const submitApplicationAction = async (): Promise<never> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: app } = await supabase
    .from('cleaner_applications')
    .select('application_data')
    .eq('user_id', user.id)
    .eq('state', 'draft')
    .single();

  if (!app) redirect('/app/apply');

  const data = app.application_data as Record<string, unknown>;

  await supabase
    .from('cleaner_applications')
    .update({
      state: 'submitted',
      submitted_at: new Date().toISOString(),
      home_zip: (data.home_zip as string) ?? null,
      travel_radius_miles: (data.travel_radius_miles as number) ?? null,
      years_experience: (data.years_experience as number) ?? null,
      why_puretask_text: (data.why_puretask_text as string) ?? null,
    })
    .eq('user_id', user.id)
    .eq('state', 'draft');

  revalidatePath('/app/apply/status');
  redirect('/app/apply/status');
};

export const adminDecisionAction = async (
  _prevState: CleanerActionState,
  formData: FormData,
): Promise<CleanerActionState> => {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated.' };

  const { data: me } = await supabase
    .from('users')
    .select('primary_role')
    .eq('id', user.id)
    .single();
  if (me?.primary_role !== 'admin') return { ok: false, error: 'Admin access required.' };

  const applicationId = formData.get('application_id');
  const decision = formData.get('decision');
  const reason = formData.get('reason') as string | null;
  const notes = formData.get('admin_notes') as string | null;

  if (!applicationId || typeof applicationId !== 'string')
    return { ok: false, error: 'Missing application ID.' };

  const now = new Date().toISOString();

  if (decision === 'start_review') {
    const { error } = await admin
      .from('cleaner_applications')
      .update({ state: 'in_review', review_started_at: now, reviewed_by_admin_id: user.id })
      .eq('id', applicationId)
      .eq('state', 'submitted');
    if (error) return { ok: false, error: error.message };
  } else if (decision === 'approve') {
    const { data: app } = await admin
      .from('cleaner_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();
    if (!app) return { ok: false, error: 'Application not found.' };

    const { data: profile, error: profileErr } = await admin
      .from('cleaner_profiles')
      .insert({ user_id: app.user_id })
      .select('id')
      .single();

    if (profileErr && profileErr.code !== '23505') return { ok: false, error: profileErr.message };

    const profileId =
      profile?.id ??
      (await admin.from('cleaner_profiles').select('id').eq('user_id', app.user_id).single()).data
        ?.id;

    const { error } = await admin
      .from('cleaner_applications')
      .update({
        state: 'approved',
        decision_at: now,
        approved_at: now,
        admin_notes: notes,
        cleaner_profile_id: profileId ?? null,
      })
      .eq('id', applicationId);
    if (error) return { ok: false, error: error.message };
  } else if (decision === 'reject') {
    const { error } = await admin
      .from('cleaner_applications')
      .update({
        state: 'rejected',
        decision_at: now,
        rejection_reason: reason,
        admin_notes: notes,
      })
      .eq('id', applicationId);
    if (error) return { ok: false, error: error.message };
  } else if (decision === 'request_info') {
    const { error } = await admin
      .from('cleaner_applications')
      .update({
        state: 'needs_info',
        info_request_message: reason,
        info_requested_at: now,
        admin_notes: notes,
      })
      .eq('id', applicationId);
    if (error) return { ok: false, error: error.message };
  } else {
    return { ok: false, error: 'Unknown decision.' };
  }

  revalidatePath('/app/admin/applications');
  revalidatePath(`/app/admin/applications/${applicationId}`);
  return { ok: true, error: null, message: 'Decision saved.' };
};

// Unused schemas reference — satisfies TypeScript import check
void STEP_SCHEMAS;
