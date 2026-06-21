import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { rankBrowseCleaners } from '@/features/discovery/browse-ranking';
import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { CleanerFilters } from '@/features/discovery/components/CleanerFilters';
import {
  browseCleaners,
  getCustomerDiscoveryAnchor,
  getZipCoverageState,
} from '@/features/discovery/queries';
import { parseBrowseSearchParams } from '@/features/discovery/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard',
  deep: 'Deep clean',
  move_out: 'Move-out',
  airbnb: 'Airbnb turnover',
};

const NEW_THRESHOLD = 5; // completed bookings below this = "new" cleaner

const CleanersPage = async ({ searchParams }: PageProps) => {
  const raw = await searchParams;
  const filters = parseBrowseSearchParams(raw);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [anchor, rows] = await Promise.all([getCustomerDiscoveryAnchor(), browseCleaners(filters)]);
  const ranked = rankBrowseCleaners(rows, anchor, filters);
  const coverage = await getZipCoverageState(anchor?.zipCode);

  const newOnes = ranked.filter((r) => r.row.completed_booking_count < NEW_THRESHOLD);
  const topOnes = ranked.filter(
    (r) =>
      r.row.completed_booking_count >= NEW_THRESHOLD && r.row.current_tier === 'all_star_expert',
  );

  const serviceLabel = filters.services[0]
    ? (SERVICE_LABELS[filters.services[0]] ?? filters.services[0])
    : 'All services';
  const context = [serviceLabel, anchor?.zipCode, `${ranked.length} available`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Cleaners near you</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{context}</p>
      </div>

      <Suspense>
        <CleanerFilters />
      </Suspense>

      {ranked.length === 0 ? (
        coverage === 'waitlist' || coverage === 'inactive' || coverage === 'seo_only' ? (
          <Card elevation={1} className="border border-brand-200 bg-brand-50/50 p-5">
            <p className="font-semibold text-neutral-900">We&apos;re not in your ZIP yet.</p>
            <p className="mt-1 text-sm text-neutral-600">
              Join the waitlist and we&apos;ll notify you the moment your area opens.
            </p>
            <Link
              href="/app/waitlist"
              className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Join waitlist
            </Link>
          </Card>
        ) : (
          <Card elevation={1} className="border border-neutral-200 p-5">
            <p className="text-sm text-neutral-500">
              No cleaners match your filters. Try widening the distance or relaxing the rating.
            </p>
          </Card>
        )
      ) : (
        <>
          {/* New cleaners rail */}
          {newOnes.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="New cleaners" />
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {newOnes.slice(0, 8).map(({ row, miles }) => (
                  <CleanerCard key={row.id} cleaner={row} distanceMiles={miles} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {/* Top cleaners */}
          {topOnes.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader
                title={anchor?.zipCode ? `Top cleaners in ${anchor.zipCode}` : 'Top cleaners'}
              />
              <div className="flex flex-col gap-2.5">
                {topOnes.map(({ row, miles }) => (
                  <CleanerCard key={row.id} cleaner={row} distanceMiles={miles} highlight />
                ))}
              </div>
            </section>
          )}

          {/* All cleaners */}
          <section className="flex flex-col gap-3">
            <SectionHeader title="All cleaners" />
            <Card
              elevation={1}
              className="divide-y divide-neutral-100 border border-neutral-200 px-3"
            >
              {ranked.map(({ row, miles }) => (
                <CleanerCard key={row.id} cleaner={row} distanceMiles={miles} variant="row" />
              ))}
            </Card>
          </section>
        </>
      )}
    </div>
  );
};

export default CleanersPage;
