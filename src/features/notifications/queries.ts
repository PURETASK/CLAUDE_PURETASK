import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendSms } from '@/lib/sms';
import { sendWebPush, type PushSubscriptionJson } from '@/lib/webpush';

export type NotificationRow = {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  deep_link: string | null;
  read_at: string | null;
  created_at: string;
  related_booking_id: string | null;
};

export const getRecentNotifications = async (limit = 20): Promise<NotificationRow[]> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select(
      'id, notification_type, title, body, deep_link, read_at, created_at, related_booking_id',
    )
    .eq('recipient_user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as NotificationRow[];
};

export const getUnreadCount = async (): Promise<number> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_user_id', user.id)
    .is('read_at', null)
    .gt('expires_at', new Date().toISOString());

  return count ?? 0;
};

export const createNotification = async (
  recipientUserId: string,
  type: string,
  title: string,
  body: string,
  opts?: {
    deepLink?: string;
    relatedBookingId?: string;
  },
) => {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await admin.from('notifications').insert({
    recipient_user_id: recipientUserId,
    notification_type: type as 'booking_confirmed',
    title,
    body,
    deep_link: opts?.deepLink ?? null,
    related_booking_id: opts?.relatedBookingId ?? null,
    expires_at: expiresAt,
    template_version: 1,
    metadata: {},
  });

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('push_enabled, push_subscriptions, sms_enabled, sms_phone')
    .eq('user_id', recipientUserId)
    .single();

  if (prefs?.push_enabled) {
    const subs = (prefs.push_subscriptions as PushSubscriptionJson[] | null) ?? [];
    await Promise.all(subs.map((sub) => sendWebPush(sub, { title, body, url: opts?.deepLink })));
  }

  if (prefs?.sms_enabled && prefs.sms_phone) {
    await sendSms(prefs.sms_phone, `${title}: ${body}`);
  }
};
