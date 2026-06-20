import { NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database.types';

type BookingStateEnum = Database['public']['Enums']['booking_state'];

/**
 * Phase 8 — auto-approval cron.
 *
 * Runs on a Vercel Cron schedule (hourly is fine; the dispute window is 24h).
 * Finds bookings stuck in `awaiting_approval` whose `auto_approval_due_at` has
 * passed and transitions them to `auto_approved` so the cleaner payout can
 * proceed downstream (Phase 7 capture).
 *
 * Auth: Vercel Cron requests carry `Authorization: Bearer <CRON_SECRET>`.
 * In dev, the route accepts unauthenticated requests so you can `curl localhost`.
 */
export const GET = async (req: Request) => {
  const authHeader = req.headers.get('authorization');
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null;

  if (env.NODE_ENV === 'production') {
    if (!expected) {
      return NextResponse.json({ error: 'CRON_SECRET not configured.' }, { status: 500 });
    }
    if (authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: stale, error } = await admin
    .from('bookings')
    .select('id, state, auto_approval_due_at')
    .eq('state', 'awaiting_approval' satisfies BookingStateEnum)
    .lt('auto_approval_due_at', nowIso)
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = stale ?? [];
  if (bookings.length === 0) {
    return NextResponse.json({ approved: 0, ranAt: nowIso });
  }

  const updates = await admin
    .from('bookings')
    .update({
      state: 'auto_approved' satisfies BookingStateEnum,
      auto_approved_at: nowIso,
    })
    .in(
      'id',
      bookings.map((b) => b.id),
    )
    .select('id');

  if (updates.error) {
    return NextResponse.json({ error: updates.error.message }, { status: 500 });
  }

  const PREV: BookingStateEnum = 'awaiting_approval';
  const NEXT: BookingStateEnum = 'auto_approved';
  const eventRows = bookings.map((b) => ({
    booking_id: b.id,
    previous_state: PREV,
    new_state: NEXT,
    triggered_by_system: 'auto_approval_cron',
    reason: '24h approval window elapsed without customer action.',
  }));

  const events = await admin.from('booking_state_events').insert(eventRows);
  if (events.error) {
    return NextResponse.json(
      { error: `State transitions applied but event log failed: ${events.error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    approved: updates.data?.length ?? bookings.length,
    ranAt: nowIso,
    bookingIds: bookings.map((b) => b.id),
  });
};
