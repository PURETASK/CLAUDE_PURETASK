import { ArrowRight, MessageSquare, Navigation } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { getMyBookingsAsCleaner, getMyCleanerProfileId } from '@/features/booking/queries';
import { getMyScoreHistory } from '@/features/reliability/queries';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ACTIVE = [
  'confirmed',
  'imminent',
  'in_transit',
  'arrived',
  'in_progress',
  'awaiting_approval',
];
const DONE = ['completed', 'approved', 'auto_approved', 'paid'];

const fmtPrice = (c: number) => `$${(c / 100).toFixed(0)}`;
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function relUntil(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (mins <= 0) return 'now';
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `in ${h}h${m ? ` ${m}m` : ''}`;
  return fmtDay(iso);
}

const BAND_TONE: Record<string, string> = {
  trusted: 'bg-success-light text-success-dark',
  good_standing: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-light text-warning-dark',
  probation: 'bg-warning-light text-warning-dark',
  suspended: 'bg-error-light text-error-dark',
};

const CleanerDashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/cleaner/apply');

  const [bookings, scoreHistory] = await Promise.all([
    getMyBookingsAsCleaner(),
    getMyScoreHistory(7),
  ]);

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from('cleaner_profiles')
    .select('current_score, current_tier, score_updated_at')
    .eq('id', cleanerProfileId)
    .single();

  const incoming = bookings.filter((b) => b.state === 'booking_requested');
  const active = bookings
    .filter((b) => ACTIVE.includes(b.state))
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const nextJob = active[0] ?? null;

  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekDone = bookings.filter(
    (b) => DONE.includes(b.state) && new Date(b.start_at).getTime() >= weekAgo,
  );
  const weekEarned = weekDone.reduce((acc, b) => acc + b.cleaner_payout_cents, 0);

  const currentBand = scoreHistory[0]?.band ?? 'good_standing';
  const currentScore = profile?.current_score ?? 90;
  const trend =
    scoreHistory.length > 1
      ? currentScore - (scoreHistory[scoreHistory.length - 1]?.score ?? currentScore)
      : null;
  const needsAttention = ['warning', 'probation', 'suspended'].includes(currentBand);

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-neutral-500">Welcome back</p>
        <h1 className="text-2xl font-bold text-neutral-900">{firstName}</h1>
      </div>

      {needsAttention && (
        <Card
          elevation={1}
          className={`border p-4 ${currentBand === 'suspended' ? 'border-error/30 bg-error-light' : 'border-warning/30 bg-warning-light'}`}
        >
          <p
            className={`text-sm font-semibold ${currentBand === 'suspended' ? 'text-error-dark' : 'text-warning-dark'}`}
          >
            {currentBand === 'suspended'
              ? 'Your account is suspended'
              : currentBand === 'probation'
                ? "You're on probation"
                : 'Your reliability score needs attention'}
          </p>
          <p
            className={`mt-1 text-sm ${currentBand === 'suspended' ? 'text-error-dark/80' : 'text-warning-dark/80'}`}
          >
            Complete confirmed jobs on time and keep cancellations low to recover your standing.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/cleaner/score"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              What affects my score
            </Link>
            {(currentBand === 'suspended' || currentBand === 'probation') && (
              <Link
                href="/cleaner/score/appeal"
                className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
              >
                Submit an appeal
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Score + tier */}
      <div className="grid grid-cols-2 gap-3">
        <Card elevation={1} className="border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-200 text-base font-bold text-neutral-900">
              {currentScore}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Reliability</p>
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${BAND_TONE[currentBand] ?? BAND_TONE.good_standing}`}
              >
                {currentBand.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          {trend !== null && trend !== 0 && (
            <p className="mt-2 text-xs text-neutral-400">
              {trend > 0 ? `+${trend}` : trend} this week
            </p>
          )}
        </Card>

        <Card elevation={1} className="border border-neutral-200 p-4">
          <p className="text-xs text-neutral-400">Current tier</p>
          <p className="mt-1 text-lg font-semibold capitalize text-neutral-900">
            {(profile?.current_tier ?? 'rising pro').replace(/_/g, ' ')}
          </p>
          {profile?.score_updated_at && (
            <p className="mt-1 text-xs text-neutral-400">
              Updated{' '}
              {new Date(profile.score_updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </Card>
      </div>

      {incoming.length > 0 && (
        <Link
          href="/app/cleaner/bookings"
          className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 transition-colors hover:bg-brand-50"
        >
          <span className="text-sm font-medium text-neutral-900">
            {incoming.length} new request{incoming.length > 1 ? 's' : ''} need a response
          </span>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-brand-600" strokeWidth={2} />
        </Link>
      )}

      {/* Next cleaning */}
      {nextJob && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Next cleaning" />
          <Card elevation={1} className="overflow-hidden border border-neutral-200">
            <div className="border-l-[3px] border-brand-600 p-4">
              <p className="text-xs font-medium text-brand-600">{relUntil(nextJob.start_at)}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {nextJob.service_display_name} · {fmtTime(nextJob.start_at)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {nextJob.other_party_name} · {nextJob.duration_hours_decimal} hrs ·{' '}
                {nextJob.address_street}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/cleaner/jobs/${nextJob.id}/on-my-way`}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
                >
                  <Navigation className="h-3.5 w-3.5" strokeWidth={1.8} />
                  On my way
                </Link>
                <Link
                  href={`/app/cleaner/bookings/${nextJob.id}/messages`}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Message
                </Link>
                <Link
                  href={`/app/cleaner/bookings/${nextJob.id}`}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Details
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* This week */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="This week"
          action={{ label: 'Earnings', href: '/app/cleaner/earnings' }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Card elevation={1} className="border border-neutral-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-neutral-900">{fmtPrice(weekEarned)}</p>
            <p className="mt-0.5 text-xs text-neutral-400">Earned</p>
          </Card>
          <Card elevation={1} className="border border-neutral-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-neutral-900">{weekDone.length}</p>
            <p className="mt-0.5 text-xs text-neutral-400">Jobs done</p>
          </Card>
        </div>
      </section>

      {/* Upcoming */}
      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title="Upcoming"
            action={{ label: 'All jobs', href: '/app/cleaner/bookings' }}
          />
          <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
            {active.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/app/cleaner/bookings/${b.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <div className="w-12 flex-shrink-0 text-center">
                  <p className="text-[10px] uppercase text-neutral-400">
                    {new Date(b.start_at).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-sm font-semibold text-neutral-900">
                    {new Date(b.start_at).getDate()}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {b.service_display_name} · {fmtTime(b.start_at)}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {b.other_party_name} · {b.address_street}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold text-neutral-900">
                  {fmtPrice(b.cleaner_payout_cents)}
                </span>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};

export default CleanerDashboardPage;
