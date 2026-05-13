import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BookingCard } from '@/features/booking/components/BookingCard';
import { getMyBookingsAsCleaner, getMyCleanerProfileId } from '@/features/booking/queries';
import { getMyScoreHistory } from '@/features/reliability/queries';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  const activeStates = [
    'confirmed',
    'imminent',
    'in_transit',
    'arrived',
    'in_progress',
    'awaiting_approval',
  ];
  const active = bookings.filter((b) => activeStates.includes(b.state));
  const past = bookings.filter(
    (b) => b.state !== 'booking_requested' && !activeStates.includes(b.state),
  );

  const bandColors: Record<string, string> = {
    trusted: 'bg-emerald-100 text-emerald-700',
    good_standing: 'bg-brand-100 text-brand-700',
    warning: 'bg-amber-100 text-amber-700',
    probation: 'bg-orange-100 text-orange-700',
    suspended: 'bg-red-100 text-red-700',
  };

  const bandBarColors: Record<string, string> = {
    trusted: 'bg-emerald-400',
    good_standing: 'bg-brand-400',
    warning: 'bg-amber-400',
    probation: 'bg-orange-400',
    suspended: 'bg-red-400',
  };

  const currentBand = scoreHistory[0]?.band ?? 'good_standing';
  const currentScore = profile?.current_score ?? 90;

  const isSuspended = currentBand === 'suspended';
  const isProbation = currentBand === 'probation';
  const isWarning = currentBand === 'warning';

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-neutral-900">Cleaner Dashboard</h1>

      {(isSuspended || isProbation || isWarning) && (
        <section
          className={`rounded-2xl border p-5 shadow-tier1 ${
            isSuspended
              ? 'border-red-200 bg-red-50'
              : isProbation
                ? 'border-orange-200 bg-orange-50'
                : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              isSuspended ? 'text-red-800' : isProbation ? 'text-orange-800' : 'text-amber-800'
            }`}
          >
            {isSuspended
              ? 'Your account is suspended'
              : isProbation
                ? "You're on probation"
                : 'Your reliability score needs attention'}
          </p>
          <p
            className={`mt-1 text-sm ${
              isSuspended ? 'text-red-700' : isProbation ? 'text-orange-700' : 'text-amber-700'
            }`}
          >
            {isSuspended
              ? 'You can’t accept new jobs right now. Resolve any open issues, then submit an appeal to have your account reviewed.'
              : isProbation
                ? 'New job offers are limited until your score recovers. Complete your confirmed jobs on time, keep cancellations to a minimum, and your standing will improve.'
                : 'A few more reliable jobs will bring your score back up. Avoid late arrivals and last-minute cancellations.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/app/cleaner/score"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
            >
              See what affects your score
            </Link>
            {(isSuspended || isProbation) && (
              <Link
                href="/cleaner/score/appeal"
                className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
              >
                Submit an appeal
              </Link>
            )}
          </div>
        </section>
      )}

      {profile && (
        <section className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-tier1">
            <p className="text-xs font-medium text-neutral-400">Reliability score</p>
            <p className="mt-1 text-3xl font-bold text-neutral-900">{currentScore}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${bandColors[currentBand] ?? bandColors.good_standing}`}
            >
              {currentBand.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-tier1">
            <p className="text-xs font-medium text-neutral-400">Current tier</p>
            <p className="mt-1 text-lg font-semibold capitalize text-neutral-900">
              {profile.current_tier.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Updated {new Date(profile.score_updated_at).toLocaleDateString()}
            </p>
          </div>
          {scoreHistory.length > 1 && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-tier1">
              <p className="mb-2 text-xs font-medium text-neutral-400">7-day trend</p>
              <div className="flex items-end gap-1">
                {[...scoreHistory].reverse().map((s, i) => (
                  <div
                    key={i}
                    title={`${s.snapshot_date}: ${s.score}`}
                    style={{ height: `${Math.round((s.score / 100) * 40)}px` }}
                    className={`w-4 rounded-sm ${bandBarColors[s.band] ?? 'bg-neutral-200'}`}
                  />
                ))}
              </div>
              <Link
                href="/app/cleaner/score"
                className="mt-2 block text-xs text-neutral-400 hover:text-neutral-700"
              >
                View history →
              </Link>
            </div>
          )}
        </section>
      )}

      <section>
        <p className="mb-3 font-semibold text-neutral-900">
          Incoming requests{incoming.length > 0 ? ` (${incoming.length})` : ''}
        </p>
        {incoming.length === 0 ? (
          <p className="text-sm text-neutral-400">No pending requests.</p>
        ) : (
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {incoming.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section>
          <p className="mb-3 font-semibold text-neutral-900">Active jobs ({active.length})</p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="mb-3 font-semibold text-neutral-500">Past bookings</p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CleanerDashboardPage;
