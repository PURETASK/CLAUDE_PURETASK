import { NextResponse } from 'next/server';

import { writeBookingStateEvent } from '@/features/booking/lib/booking-states';
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

  const results = await Promise.allSettled(
    (bookings ?? []).map(async (b) => {
      await writeBookingStateEvent(supabase, b.id, 'auto_approved', 'system-cron', {
        auto_approved: true,
      });
      return b.id;
    }),
  );

  const approved = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ approved });
}
