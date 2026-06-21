import { NextRequest, NextResponse } from 'next/server';

import { GET as runAutoApprove } from '@/app/api/cron/auto-approve/route';
import { GET as runDailyReminders } from '@/app/api/cron/daily-reminders/route';
import { GET as runNightlyReliability } from '@/app/api/cron/nightly-reliability/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Hobby-plan umbrella cron.
 *
 * Vercel's Hobby plan allows only 2 cron jobs, each at daily-or-less frequency.
 * The app has three jobs that each want their own (more frequent) schedule, so
 * this single daily job runs all three in sequence — keeping the whole project
 * within the Hobby limit (this + weekly-payout = 2 crons).
 *
 * The underlying route handlers are unchanged and still work as standalone
 * endpoints. To restore richer per-job schedules (hourly auto-approve +
 * reminders), upgrade to Vercel Pro and replace vercel.json with vercel.pro.json
 * — no code change required.
 *
 * Vercel Cron sends GET with `Authorization: Bearer <CRON_SECRET>`; each child
 * handler is invoked the same way. One job failing does not abort the others.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const childRequest = () =>
    new NextRequest('https://cron.internal/api/cron/nightly', {
      headers: { authorization: `Bearer ${secret ?? ''}` },
    });

  const jobs: [string, () => Promise<Response>][] = [
    ['autoApprove', () => runAutoApprove(childRequest())],
    ['dailyReminders', () => runDailyReminders(childRequest())],
    ['nightlyReliability', () => runNightlyReliability(childRequest())],
  ];

  const ran: Record<string, unknown> = {};
  for (const [name, run] of jobs) {
    try {
      const res = await run();
      ran[name] = { status: res.status, result: await res.json().catch(() => null) };
    } catch (err) {
      ran[name] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json({ ok: true, ran });
}
