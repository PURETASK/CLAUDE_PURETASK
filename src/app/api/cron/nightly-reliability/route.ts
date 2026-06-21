import { NextRequest, NextResponse } from 'next/server';

import { notify } from '@/features/notifications/dispatch';
import { env } from '@/lib/env';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type MetricBreakdown = Record<string, { points: number; max: number; pct: number }>;

function determineBand(score: number): string {
  if (score >= 85) return 'trusted';
  if (score >= 70) return 'good_standing';
  if (score >= 55) return 'warning';
  if (score >= 40) return 'probation';
  return 'suspended';
}

const BAND_LABEL: Record<string, string> = {
  trusted: 'Trusted',
  good_standing: 'Good standing',
  warning: 'Warning',
  probation: 'Probation',
  suspended: 'Suspended',
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const today = new Date();
  const snapshotDate = today.toISOString().slice(0, 10);
  const windowEnd = today.toISOString();
  const windowStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: cleaners } = await admin
    .from('cleaner_profiles')
    .select('id, user_id, current_score, average_rating')
    .eq('is_active', true);

  if (!cleaners || cleaners.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No active cleaners.' });
  }

  const results: { cleanerId: string; score: number; band: string }[] = [];

  for (const cleaner of cleaners) {
    const { data: events } = await admin
      .from('reliability_events')
      .select('metric_category, point_delta')
      .eq('cleaner_id', cleaner.id)
      .eq('is_overturned', false)
      .gte('event_occurred_at', windowStart)
      .lte('event_occurred_at', windowEnd);

    const byCategory: Record<string, number> = {};
    for (const ev of events ?? []) {
      byCategory[ev.metric_category] = (byCategory[ev.metric_category] ?? 0) + ev.point_delta;
    }

    const ratingBonus = cleaner.average_rating != null ? (cleaner.average_rating / 5) * 25 - 20 : 0;

    const totalDelta = Object.values(byCategory).reduce((s, v) => s + v, 0) + ratingBonus;

    const score = Math.max(0, Math.min(100, 100 + totalDelta));
    const band = determineBand(score);

    const breakdown: MetricBreakdown = {};
    for (const [cat, pts] of Object.entries(byCategory)) {
      breakdown[cat] = { points: pts, max: 30, pct: Math.round((pts / 30) * 100) };
    }
    if (cleaner.average_rating != null) {
      breakdown['rating'] = {
        points: Math.round(ratingBonus),
        max: 25,
        pct: Math.round(((cleaner.average_rating - 1) / 4) * 100),
      };
    }

    await admin.from('reliability_score_snapshots').upsert(
      {
        cleaner_id: cleaner.id,
        snapshot_date: snapshotDate,
        score: Math.round(score),
        band,
        metric_breakdown: breakdown,
        window_start_date: windowStart.slice(0, 10),
        window_end_date: windowEnd.slice(0, 10),
      },
      { onConflict: 'cleaner_id,snapshot_date' },
    );

    await admin
      .from('cleaner_profiles')
      .update({ current_score: Math.round(score), score_updated_at: today.toISOString() })
      .eq('id', cleaner.id);

    // Notify the cleaner only when their standing band actually changes (not on
    // every minor score tick), so the notification is meaningful.
    const oldScore = cleaner.current_score ?? 100;
    const oldBand = determineBand(oldScore);
    if (oldBand !== band && cleaner.user_id) {
      const improved = Math.round(score) > oldScore;
      await notify({
        recipientUserId: cleaner.user_id,
        type: improved ? 'score_increased' : 'score_decreased',
        title: improved
          ? 'Your reliability standing improved'
          : 'Your reliability standing changed',
        body: `Your standing is now "${BAND_LABEL[band] ?? band}" (score ${Math.round(score)}/100).`,
        deepLink: '/app/cleaner/score',
      });
    }

    results.push({ cleanerId: cleaner.id, score: Math.round(score), band });
  }

  return NextResponse.json({ processed: results.length, results });
}
