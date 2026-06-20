import { NextResponse } from 'next/server';

import { settleApprovedBooking } from '@/features/booking/lib/settle-approval';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('state', 'awaiting_approval')
    .lte('auto_approval_due_at', new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Each booking is fully settled: capture the held payment, advance to
  // `auto_approved`, and create the cleaner's payout line item. Capture-safe —
  // a booking whose capture fails is left in `awaiting_approval` and retried
  // next run rather than being marked approved with no money taken.
  const results = await Promise.allSettled(
    (bookings ?? []).map(async (b) => {
      const settled = await settleApprovedBooking(supabase, {
        bookingId: b.id,
        newState: 'auto_approved',
        actorUserId: null,
        reason: 'Auto-approved after 24h customer review window.',
      });
      if (!settled.ok) throw new Error(`${b.id}: ${settled.error}`);
      return b.id;
    }),
  );

  const approved = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return NextResponse.json({ approved, failed });
}
