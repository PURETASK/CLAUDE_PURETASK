import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { MatchScoreBreakdown } from '@/features/discovery/components/MatchScoreBreakdown';
import { FavoriteButton } from '@/features/discovery/components/FavoriteButton';
import { TierBadge } from '@/features/discovery/components/TierBadge';
import { computeMatchTransparency } from '@/features/discovery/match-score';
import {
  getCleanerProfile,
  getCustomerDiscoveryAnchor,
  haversineMiles,
  isCleanerFavoritedByCurrentCustomer,
  listRecentPublicReviewsForCleaner,
} from '@/features/discovery/queries';
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

  const [cleaner, isFavorited, reviews] = await Promise.all([
    getCleanerProfile(id),
    isCleanerFavoritedByCurrentCustomer(id),
    listRecentPublicReviewsForCleaner(id, 5),
  ]);
  if (!cleaner) notFound();

  const anchor = await getCustomerDiscoveryAnchor();
  const miles =
    anchor?.latitude != null &&
    anchor.longitude != null &&
    cleaner.home_latitude != null &&
    cleaner.home_longitude != null
      ? haversineMiles(
          anchor.latitude,
          anchor.longitude,
          cleaner.home_latitude,
          cleaner.home_longitude,
        )
      : null;

  const transparency = computeMatchTransparency({
    distanceMiles: miles,
    currentTier: cleaner.current_tier,
    customerWantsBookingSoon: false,
    servesCustomerZip: Boolean(
      anchor?.zipCode && cleaner.service_zip_codes.includes(anchor.zipCode),
    ),
    cleanerSpecialtyKeys: cleaner.specialty_keys,
    requestedServiceKeys: [],
    completedBookingCount: cleaner.completed_booking_count,
    cleanerSinceAt: cleaner.cleaner_since_at,
  });

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
        <MatchScoreBreakdown transparency={transparency} hasZipFilter={false} />
      </section>

      <section className="rounded border bg-white p-5">
        <p className="mb-3 font-medium">Recent reviews</p>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Reviews will appear here as customers complete bookings.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="text-sm text-zinc-700">
                <p className="font-medium">{review.stars} ★</p>
                <p className="text-zinc-600">{review.body ?? 'No comment provided.'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        <Link
          href={`/app/cleaners/${cleaner.id}/book`}
          className="self-start rounded bg-black px-6 py-2.5 text-sm text-white hover:bg-zinc-800"
        >
          Request to book
        </Link>
        <Link
          href={`/app/recurring/new?cleaner_id=${cleaner.id}`}
          className="self-start rounded border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Set up recurring
        </Link>
        <FavoriteButton cleanerId={cleaner.id} initialIsFavorited={isFavorited} />
      </div>
    </div>
  );
};

export default CleanerProfilePage;
