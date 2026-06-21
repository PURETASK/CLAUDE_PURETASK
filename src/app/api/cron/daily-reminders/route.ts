import { NextResponse } from 'next/server';

import { notifyBookingParty } from '@/features/notifications/dispatch';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Hourly reminder sweep. Each booking falls into a given 1-hour window for
 * exactly one run, so reminders aren't repeated; an extra dedupe check against
 * existing notifications guards against at-least-once cron retries.
 *
 * Vercel Cron invokes this as GET with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const HOUR = 60 * 60 * 1000;

  const alreadySent = async (bookingId: string, type: string): Promise<boolean> => {
    const { count } = await admin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('related_booking_id', bookingId)
      .eq('notification_type', type as 'booking_confirmed');
    return (count ?? 0) > 0;
  };

  let imminent = 0;
  let reviewPrompts = 0;

  // 1. T-24h reminder: bookings starting in [24h, 25h).
  const { data: upcoming } = await admin
    .from('bookings')
    .select('id, booking_number')
    .in('state', ['confirmed', 'imminent'])
    .gte('start_at', iso(now + 24 * HOUR))
    .lt('start_at', iso(now + 25 * HOUR));

  for (const b of upcoming ?? []) {
    if (await alreadySent(b.id, 'booking_imminent_reminder')) continue;
    await notifyBookingParty(b.id, 'customer', {
      type: 'booking_imminent_reminder',
      title: 'Your cleaning is tomorrow',
      body: `Reminder: booking ${b.booking_number} is scheduled in about 24 hours.`,
      deepLink: `/app/bookings/${b.id}`,
    });
    await notifyBookingParty(b.id, 'cleaner', {
      type: 'booking_imminent_reminder',
      title: 'Upcoming job tomorrow',
      body: `Reminder: booking ${b.booking_number} is in about 24 hours.`,
      deepLink: `/app/cleaner/bookings/${b.id}`,
    });
    imminent++;
  }

  // 2. Review prompt ~24h after the job was approved, if no review exists yet.
  const approvedSeen = new Set<string>();
  for (const col of ['customer_approved_at', 'auto_approved_at'] as const) {
    const { data: approved } = await admin
      .from('bookings')
      .select('id, booking_number')
      .in('state', ['approved', 'auto_approved', 'paid'])
      .gte(col, iso(now - 25 * HOUR))
      .lt(col, iso(now - 24 * HOUR));

    for (const b of approved ?? []) {
      if (approvedSeen.has(b.id)) continue;
      approvedSeen.add(b.id);

      const { data: review } = await admin
        .from('reviews')
        .select('id')
        .eq('booking_id', b.id)
        .maybeSingle();
      if (review) continue;
      if (await alreadySent(b.id, 'review_prompt')) continue;

      await notifyBookingParty(b.id, 'customer', {
        type: 'review_prompt',
        title: 'How was your cleaning?',
        body: `Leave a review for booking ${b.booking_number} — it helps your cleaner.`,
        deepLink: `/app/bookings/${b.id}/review`,
      });
      reviewPrompts++;
    }
  }

  return NextResponse.json({ imminent, reviewPrompts });
}
