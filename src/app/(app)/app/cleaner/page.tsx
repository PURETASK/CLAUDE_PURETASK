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
  const active = bookings.filter((b) => b.state === 'confirmed');
  const past = bookings.filter((b) =>
    [
      'cleaner_declined',
      'cancelled_by_customer',
      'cancelled_by_cleaner',
      'completed',
      'paid',
    ].includes(b.state),
  );

  const bandColors: Record<string, string> = {
    trusted: 'bg-emerald-100 text-emerald-700',
    good_standing: 'bg-blue-100 text-blue-700',
    warning: 'bg-amber-100 text-amber-700',
    probation: 'bg-orange-100 text-orange-700',
    suspended: 'bg-red-100 text-red-700',
  };

  const currentBand = scoreHistory[0]?.band ?? 'good_standing';
  const currentScore = profile?.current_score ?? 90;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Cleaner Dashboard</h1>

      {profile && (
        <section className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-100 bg-white px-5 py-4">
            <p className="text-xs text-zinc-400">Reliability score</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">{currentScore}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${bandColors[currentBand] ?? bandColors.good_standing}`}
            >
              {currentBand.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-white px-5 py-4">
            <p className="text-xs text-zinc-400">Current tier</p>
            <p className="mt-1 text-lg font-semibold capitalize text-zinc-900">
              {profile.current_tier.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Updated {new Date(profile.score_updated_at).toLocaleDateString()}
            </p>
          </div>
          {scoreHistory.length > 1 && (
            <div className="rounded-xl border border-zinc-100 bg-white px-5 py-4">
              <p className="mb-2 text-xs text-zinc-400">7-day trend</p>
              <div className="flex items-end gap-1">
                {[...scoreHistory].reverse().map((s, i) => (
                  <div
                    key={i}
                    title={`${s.snapshot_date}: ${s.score}`}
                    style={{ height: `${Math.round((s.score / 100) * 40)}px` }}
                    className={`w-4 rounded-sm ${bandColors[s.band] ?? 'bg-zinc-200'}`}
                  />
                ))}
              </div>
              <Link
                href="/app/cleaner/score"
                className="mt-2 block text-xs text-zinc-400 hover:text-zinc-700"
              >
                View history →
              </Link>
            </div>
          )}
        </section>
      )}

      <section>
        <p className="mb-3 font-medium">
          Incoming requests{incoming.length > 0 ? ` (${incoming.length})` : ''}
        </p>
        {incoming.length === 0 ? (
          <p className="text-sm text-zinc-400">No pending requests.</p>
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
          <p className="mb-3 font-medium">Confirmed ({active.length})</p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((b) => (
              <BookingCard key={b.id} booking={b} href={`/app/cleaner/bookings/${b.id}`} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="mb-3 font-medium text-zinc-500">Past bookings</p>
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
