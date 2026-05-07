import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { MatchScoreBreakdown } from '@/features/discovery/components/MatchScoreBreakdown';
import { TierBadge } from '@/features/discovery/components/TierBadge';
import { getCleanerProfile } from '@/features/discovery/queries';
import { computeMatchScore } from '@/features/discovery/scoring';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard clean',
  deep: 'Deep clean',
  move_out: 'Move-out clean',
  airbnb: 'Airbnb turnover',
};

const CleanerProfilePage = async ({ params }: PageProps) => {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleaner = await getCleanerProfile(id);
  if (!cleaner) notFound();

  const breakdown = computeMatchScore(
    {
      current_tier: cleaner.current_tier,
      average_rating: cleaner.average_rating,
      current_score: cleaner.current_score,
      review_count: cleaner.review_count,
      is_veteran: cleaner.is_veteran,
      zip_covered: true,
    },
    false,
  );

  const offeredServices = Object.entries(cleaner.hourly_rates_cents).filter(([, rate]) => rate > 0);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/cleaners" className="text-sm text-zinc-500 hover:text-zinc-900">
          Find a Cleaner
        </Link>
        <span className="text-zinc-300">/</span>
        <h1 className="text-xl font-semibold">{cleaner.full_name}</h1>
      </div>

      <section className="rounded border bg-white p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <TierBadge tier={cleaner.current_tier} size="md" />
            {cleaner.average_rating != null ? (
              <span className="text-sm text-zinc-500">
                {cleaner.average_rating.toFixed(1)} ★ · {cleaner.review_count}{' '}
                {cleaner.review_count === 1 ? 'review' : 'reviews'}
              </span>
            ) : (
              <span className="text-sm text-zinc-400">No reviews yet</span>
            )}
            <span className="text-xs text-zinc-400">
              Cleaner since {new Date(cleaner.cleaner_since_at).getFullYear()}
            </span>
          </div>
          <div className="h-16 w-16 rounded-full bg-zinc-100" />
        </div>
        {cleaner.bio ? (
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{cleaner.bio}</p>
        ) : (
          <p className="text-sm text-zinc-400">No bio yet.</p>
        )}
      </section>

      {offeredServices.length > 0 && (
        <section className="rounded border bg-white p-5">
          <p className="mb-3 font-medium">Services &amp; rates</p>
          <div className="flex flex-col gap-2">
            {offeredServices.map(([type, rate]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span>{SERVICE_LABELS[type] ?? type}</span>
                <span className="font-medium">${(rate / 100).toFixed(0)}/hr</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {cleaner.badges.length > 0 && (
        <section className="rounded border bg-white p-5">
          <p className="mb-3 font-medium">Badges</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.badges.map((b) => (
              <span
                key={b.id}
                title={b.description}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                {b.display_label}
              </span>
            ))}
          </div>
        </section>
      )}

      {cleaner.specialties.length > 0 && (
        <section className="rounded border bg-white p-5">
          <p className="mb-3 font-medium">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.specialties.map((s) => (
              <span
                key={s.id}
                title={s.description}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {s.display_label}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="mb-3 text-sm font-medium text-zinc-500">Match score breakdown</p>
        <MatchScoreBreakdown
          breakdown={breakdown}
          tier={cleaner.current_tier}
          hasZipFilter={false}
        />
      </section>

      <Link
        href={`/app/cleaners/${cleaner.id}/book`}
        className="self-start rounded bg-black px-6 py-2.5 text-sm text-white hover:bg-zinc-800"
      >
        Book this cleaner
      </Link>
    </div>
  );
};

export default CleanerProfilePage;
