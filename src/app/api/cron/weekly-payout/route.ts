import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { isStripeConfigured } from '@/lib/integrations';
import { getStripe } from '@/lib/stripe/webhooks';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe not configured — skipping weekly payout' },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const results: { cleanerId: string; status: string; amount?: number; error?: string }[] = [];

  // Find all cleaners with unpaid line items
  const { data: unpaidItems } = await admin
    .from('payout_line_items')
    .select('id, cleaner_id, amount_cents')
    .is('payout_id', null);

  if (!unpaidItems || unpaidItems.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending payouts.' });
  }

  // Group by cleaner
  const byCleanerId = unpaidItems.reduce<Record<string, { ids: string[]; totalCents: number }>>(
    (acc, item) => {
      if (!acc[item.cleaner_id]) acc[item.cleaner_id] = { ids: [], totalCents: 0 };
      acc[item.cleaner_id]!.ids.push(item.id);
      acc[item.cleaner_id]!.totalCents += item.amount_cents;
      return acc;
    },
    {},
  );

  // Process each cleaner
  for (const [cleanerId, { ids, totalCents }] of Object.entries(byCleanerId)) {
    try {
      const { data: profile } = await admin
        .from('cleaner_profiles')
        .select('stripe_connect_account_id')
        .eq('id', cleanerId)
        .single();

      if (!profile?.stripe_connect_account_id) {
        results.push({ cleanerId, status: 'skipped_no_connect' });
        continue;
      }

      // Create payout record
      const { data: payout, error: payoutErr } = await admin
        .from('payouts')
        .insert({
          cleaner_id: cleanerId,
          stripe_account_id: profile.stripe_connect_account_id,
          amount_cents: totalCents,
          net_amount_cents: totalCents,
          instant_fee_cents: 0,
          is_instant: false,
          currency: 'usd',
          state: 'pending',
          initiated_at: now,
          period_end_at: now,
        })
        .select('id')
        .single();

      if (payoutErr || !payout) {
        results.push({ cleanerId, status: 'failed_db', error: payoutErr?.message });
        continue;
      }

      // Transfer via Stripe Connect
      const transfer = await getStripe().transfers.create({
        amount: totalCents,
        currency: 'usd',
        destination: profile.stripe_connect_account_id,
        metadata: { payout_id: payout.id, cleaner_id: cleanerId },
      });

      // Update payout to in_transit
      await admin
        .from('payouts')
        .update({
          stripe_payout_id: transfer.id,
          state: 'in_transit',
          in_transit_at: now,
        })
        .eq('id', payout.id);

      // Link line items to payout
      await admin.from('payout_line_items').update({ payout_id: payout.id }).in('id', ids);

      results.push({ cleanerId, status: 'success', amount: totalCents });
    } catch (err) {
      results.push({ cleanerId, status: 'failed_stripe', error: String(err) });
    }
  }

  const succeeded = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status.startsWith('failed')).length;

  return NextResponse.json({ processed: succeeded, failed, results });
}
