import Image from 'next/image';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { CleanerFilters } from '@/features/discovery/components/CleanerFilters';
import { rankBrowseCleaners } from '@/features/discovery/browse-ranking';
import {
  browseCleaners,
  getCustomerDiscoveryAnchor,
  getZipCoverageState,
} from '@/features/discovery/queries';
import { parseBrowseSearchParams } from '@/features/discovery/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ICONS } from '@/lib/assets';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Image src={ICONS.cleaning} alt="" width={52} height={52} className="rounded-xl drop-shadow-md" />
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Find a Cleaner</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Browse verified cleaners in Northern California.
          </p>
        </div>
      </div>

      <Suspense>
        <CleanerFilters />
      </Suspense>

      {ranked.length === 0 ? (
        coverage === 'waitlist' || coverage === 'inactive' || coverage === 'seo_only' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">We&apos;re not in your ZIP yet.</p>
            <p className="mt-1">
              Join the waitlist and we&apos;ll notify you as soon as your area opens.
            </p>
            <Link className="mt-3 inline-block underline" href="/app/waitlist">
              Join waitlist
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No cleaners match. Try widening your distance or relaxing filters.
          </p>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranked.map(({ row, transparency, miles }) => (
            <CleanerCard key={row.id} cleaner={row} score={transparency} distanceMiles={miles} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CleanersPage;
