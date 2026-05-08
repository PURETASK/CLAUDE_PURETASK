'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type NotifSettingsState = { ok: boolean; error: string | null };

export const saveSmsSettingsAction = async (
  _prev: NotifSettingsState,
  formData: FormData,
): Promise<NotifSettingsState> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const smsEnabled = formData.get('sms_enabled') === 'true';
  const smsPhone = (formData.get('sms_phone') as string | null)?.trim() || null;

  if (smsEnabled && !smsPhone) {
    return { ok: false, error: 'Enter a phone number to enable SMS.' };
  }

  const phone = smsPhone ? smsPhone.replace(/\s/g, '') : null;
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { ok: false, error: 'Enter a valid international phone number (e.g. +12125551234).' };
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from('notification_preferences')
    .upsert(
      { user_id: user.id, sms_enabled: smsEnabled, sms_phone: phone },
      { onConflict: 'user_id' },
    );

  revalidatePath('/settings/notifications');
  return { ok: true, error: null };
};
