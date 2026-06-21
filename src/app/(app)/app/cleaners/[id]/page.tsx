import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { MoneyRow } from '@/components/ui/money-row';
import { Stars } from '@/components/ui/stars';
import { FavoriteButton } from '@/features/discovery/components/FavoriteButton';
import { MatchScoreBreakdown } from '@/features/discovery/components/MatchScoreBreakdown';
import { TierBadge } from '@/features/discovery/components/TierBadge';
import { computeMatchTransparency } from '@/features/discovery/match-score';
import {
  getCleanerProfile,
  getCustomerDiscoveryAnchor,
  haversineMiles,
  isCleanerFavoritedByCurrentCustomer,
  listRecentPublicReviewsForCleaner,
} from '@/features/discovery/queries';
import { ICONS } from '@/lib/assets';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard cleaning',
  deep: 'Deep clean',
  move_out: 'Move-out cleaning',
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
  const minRateCents = offeredServices.length
    ? Math.min(...offeredServices.map(([, rate]) => rate))
    : null;

  const stats: { value: string; label: string }[] = [];
  if (minRateCents != null)
    stats.push({ value: `$${Math.round(minRateCents / 100)}`, label: 'Per hr' });
  stats.push({ value: `${cleaner.completed_booking_count}`, label: 'Cleanings' });
  if (miles != null) stats.push({ value: miles.toFixed(1), label: 'Mi away' });
  if (cleaner.average_rating != null)
    stats.push({ value: cleaner.average_rating.toFixed(1), label: 'Rating' });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {/* Top bar: back · name · favorite */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/cleaners"
          className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          <span className="hidden sm:inline">Browse</span>
        </Link>
        <h1 className="truncate text-lg font-semibold text-neutral-900">{cleaner.full_name}</h1>
        <div className="ml-auto">
          <FavoriteButton cleanerId={cleaner.id} initialIsFavorited={isFavorited} />
        </div>
      </div>

      {/* Profile header */}
      <Card elevation={1} className="border border-neutral-200 p-5">
        <div className="flex gap-4">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
            <Image src={ICONS.contacts} alt="" width={56} height={56} className="opacity-60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-neutral-900">{cleaner.full_name}</p>
            <div className="mt-1">
              {cleaner.average_rating != null ? (
                <Stars rating={cleaner.average_rating} count={cleaner.review_count} size="sm" />
              ) : (
                <span className="text-sm text-neutral-400">No reviews yet</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TierBadge tier={cleaner.current_tier} size="md" />
              <span className="text-xs text-neutral-400">
                Cleaner since {new Date(cleaner.cleaner_since_at).getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {cleaner.bio ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {cleaner.bio}
          </p>
        ) : (
          <p className="mt-4 text-sm text-neutral-400">No bio yet.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/app/cleaners/${cleaner.id}/book`}
            className="flex-1 rounded-xl bg-gradient-brand px-6 py-2.5 text-center text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Book {cleaner.full_name.split(' ')[0]}
          </Link>
          <Link
            href={`/app/recurring/new?cleaner_id=${cleaner.id}`}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Set up recurring
          </Link>
        </div>
      </Card>

      {/* Stats strip */}
      {stats.length > 0 && (
        <Card elevation={1} className="border border-neutral-200">
          <div className="flex divide-x divide-neutral-100">
            {stats.map((s) => (
              <div key={s.label} className="flex-1 px-2 py-4 text-center">
                <p className="text-lg font-semibold text-neutral-900">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Services & rates */}
      {offeredServices.length > 0 && (
        <Card elevation={1} className="border border-neutral-200 px-5 py-4">
          <p className="mb-1 text-base font-semibold text-neutral-900">Services &amp; rates</p>
          <div className="divide-y divide-neutral-100">
            {offeredServices.map(([type, rate]) => (
              <MoneyRow
                key={type}
                label={SERVICE_LABELS[type] ?? type}
                amount={`$${Math.round(rate / 100)}/hr`}
                className="py-2.5"
              />
            ))}
          </div>
        </Card>
      )}

      {/* Badges */}
      {cleaner.badges.length > 0 && (
        <Card elevation={1} className="border border-neutral-200 px-5 py-4">
          <p className="mb-3 text-base font-semibold text-neutral-900">Badges earned</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.badges.map((b) => (
              <span
                key={b.id}
                title={b.description}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
              >
                {b.display_label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Specialties */}
      {cleaner.specialties.length > 0 && (
        <Card elevation={1} className="border border-neutral-200 px-5 py-4">
          <p className="mb-3 text-base font-semibold text-neutral-900">Specialties</p>
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
        </Card>
      )}

      {/* Reviews */}
      <Card elevation={1} className="border border-neutral-200 px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-neutral-900">Reviews</p>
          {cleaner.average_rating != null && (
            <Stars rating={cleaner.average_rating} count={cleaner.review_count} size="sm" />
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Reviews will appear here as customers complete bookings.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-l-2 border-neutral-200 pl-3">
                <Stars rating={review.stars} size="sm" hideValue className="mb-1" />
                <p className="text-sm leading-relaxed text-neutral-700">
                  {review.body ?? 'No comment provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Service area */}
      {cleaner.service_zip_codes.length > 0 && (
        <Card elevation={1} className="border border-neutral-200 px-5 py-4">
          <p className="mb-3 text-base font-semibold text-neutral-900">Service area</p>
          <div className="flex flex-wrap gap-2">
            {cleaner.service_zip_codes.slice(0, 12).map((zip) => (
              <span
                key={zip}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {zip}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Why this match */}
      <section>
        <p className="mb-3 text-sm font-medium text-neutral-500">
          Why you&apos;re seeing this cleaner
        </p>
        <MatchScoreBreakdown transparency={transparency} hasZipFilter={false} />
      </section>
    </div>
  );
};

export default CleanerProfilePage;
