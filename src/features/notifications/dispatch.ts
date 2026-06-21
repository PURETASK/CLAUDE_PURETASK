import { sendEmail } from '@/lib/email/resend';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

import { createNotification } from './queries';

export type NotifyEmail = { subject: string; html: string };

export type NotifyInput = {
  recipientUserId: string;
  /** A `notification_type` enum value. */
  type: string;
  /** In-app + push title. */
  title: string;
  /** In-app + push + SMS body. */
  body: string;
  deepLink?: string;
  relatedBookingId?: string;
  /** Optional rich email (a template result). Sent to the recipient's address. */
  email?: NotifyEmail | null;
};

/**
 * Single entry point to notify a user about something, across every channel
 * they have enabled: in-app inbox (always), web push + SMS (per their
 * notification_preferences), and — when an email template is supplied — email.
 *
 * Channel failures are swallowed and logged: a notification must never break
 * the booking/payment/etc. action that triggered it.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await createNotification(input.recipientUserId, input.type, input.title, input.body, {
      deepLink: input.deepLink,
      relatedBookingId: input.relatedBookingId,
    });
  } catch (e) {
    console.error('[notify] in-app/push/sms failed:', input.type, e);
  }

  if (input.email) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: u } = await admin
        .from('users')
        .select('email')
        .eq('id', input.recipientUserId)
        .single();
      if (u?.email) {
        await sendEmail({ to: u.email, subject: input.email.subject, html: input.email.html });
      }
    } catch (e) {
      console.error('[notify] email failed:', input.type, e);
    }
  }
}

/**
 * Notify one party of a booking (resolves their user_id from the booking).
 * Convenience wrapper so lifecycle actions don't repeat the profile lookups.
 */
export async function notifyBookingParty(
  bookingId: string,
  party: 'customer' | 'cleaner',
  n: Omit<NotifyInput, 'recipientUserId' | 'relatedBookingId'>,
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: b } = await admin
      .from('bookings')
      .select('customer_id, cleaner_id')
      .eq('id', bookingId)
      .single();
    if (!b) return;

    let userId: string | null = null;
    if (party === 'customer' && b.customer_id) {
      const { data: p } = await admin
        .from('customer_profiles')
        .select('user_id')
        .eq('id', b.customer_id)
        .single();
      userId = p?.user_id ?? null;
    } else if (party === 'cleaner' && b.cleaner_id) {
      const { data: p } = await admin
        .from('cleaner_profiles')
        .select('user_id')
        .eq('id', b.cleaner_id)
        .single();
      userId = p?.user_id ?? null;
    }
    if (!userId) return;

    await notify({ ...n, recipientUserId: userId, relatedBookingId: bookingId });
  } catch (e) {
    console.error('[notifyBookingParty] failed:', n.type, e);
  }
}

/** Notify every active admin (e.g. application submitted, dispute filed, ticket opened). */
export async function notifyAdmins(
  type: string,
  title: string,
  body: string,
  opts?: { deepLink?: string; relatedBookingId?: string },
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: admins } = await admin
      .from('admin_profiles')
      .select('user_id')
      .is('deleted_at', null);
    await Promise.all(
      (admins ?? []).map((a) => notify({ recipientUserId: a.user_id, type, title, body, ...opts })),
    );
  } catch (e) {
    console.error('[notifyAdmins] failed:', type, e);
  }
}
