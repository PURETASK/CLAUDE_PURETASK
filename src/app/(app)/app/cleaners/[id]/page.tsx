import Image from 'next/image';
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
import { ICONS } from '@/lib/assets';

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
  const isBackgroundChecked = cleaner.badges.some((b) => b.display_label?.toLowerCase().includes('background'));
  const isZipLocked = cleaner.badges.some((b) => b.display_label?.toLowerCase().includes('zip'));

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/cleaners" className="text-sm text-neutral-500 hover:text-neutral-900">
          Find a Cleaner
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">{cleaner.full_name}</h1>
      </div>

      {/* Profile header */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <TierBadge tier={cleaner.current_tier} size="md" />
            {cleaner.average_rating != null ? (
              <span className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">{cleaner.average_rating.toFixed(1)}</span>
                {' ★ · '}
                {cleaner.review_count} {cleaner.review_count === 1 ? 'review' : 'reviews'}
              </span>
            ) : (
              <span className="text-sm text-neutral-400">No reviews yet</span>
            )}
            <span className="text-xs text-neutral-400">
              Cleaner since {new Date(cleaner.cleaner_since_at).getFullYear()}
            </span>
          </div>
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-neutral-100 bg-neutral-50">
            <Image src={ICONS.contacts} alt="" width={40} height={40} className="opacity-60" />
          </div>
        </div>
        {cleaner.bio ? (
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{cleaner.bio}</p>
        ) : (
          <p className="text-sm text-neutral-400">No bio yet.</p>
        )}

        {/* Trust badges */}
        {(isBackgroundChecked || isZipLocked || cleaner.specialties.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            {isBackgroundChecked && (
              <Link
                href="/trust/background-checked"
                className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition-all hover:bg-brand-100"
              >
                <Image src={ICONS.checkmark} alt="" width={12} height={12} />
                Background checked
              </Link>
            )}
            {isZipLocked && (
              <Link
                href="/trust/zip-locked"
                className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition-all hover:bg-brand-100"
              >
                <Image src={ICONS.checkmark} alt="" width={12} height={12} />
                ZIP verified
              </Link>
            )}
            {cleaner.specialties.slice(0, 2).map((s) => (
              <Link
                key={s.id}
                href="/trust/specialty-endorsed"
                title={s.description}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600 transition-all hover:bg-neutral-100"
              >
                {s.display_label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Services & rates */}
      {offeredServices.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="mb-3 font-semibold text-neutral-900">Services &amp; rates</p>
          <div className="flex flex-col gap-2">
            {offeredServices.map(([type, rate]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{SERVICE_LABELS[type] ?? type}</span>
                <span className="font-semibold text-neutral-900">${(rate / 100).toFixed(0)}/hr</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Badges */}
      {cleaner.badges.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="mb-3 font-semibold text-neutral-900">Badges</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.badges.map((b) => (
              <span
                key={b.id}
                title={b.description}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                {b.display_label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Specialties */}
      {cleaner.specialties.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="mb-3 font-semibold text-neutral-900">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.specialties.map((s) => (
              <span
                key={s.id}
                title={s.description}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {s.display_label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Match score */}
      <section>
        <p className="mb-3 text-sm font-medium text-neutral-500">Match score breakdown</p>
        <MatchScoreBreakdown transparency={transparency} hasZipFilter={false} />
      </section>

      {/* Reviews */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <p className="mb-3 font-semibold text-neutral-900">Recent reviews</p>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Reviews will appear here as customers complete bookings.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {reviews.map((review) => (
              <li key={review.id} className="py-3 text-sm first:pt-0 last:pb-0">
                <p className="mb-1 font-medium text-neutral-900">{review.stars} ★</p>
                <p className="text-neutral-600">{review.body ?? 'No comment provided.'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/app/cleaners/${cleaner.id}/book`}
          className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Request to book
        </Link>
        <Link
          href={`/app/recurring/new?cleaner_id=${cleaner.id}`}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Set up recurring
        </Link>
        <FavoriteButton cleanerId={cleaner.id} initialIsFavorited={isFavorited} />
      </div>
    </div>
  );
};

export default CleanerProfilePage;
