import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { CleanerFilters } from '@/features/discovery/components/CleanerFilters';
import { listCleaners } from '@/features/discovery/queries';
import { computeMatchScore } from '@/features/discovery/scoring';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { searchParams: Promise<{ zip?: string; service?: string }> };

const CleanersPage = async ({ searchParams }: PageProps) => {
  const { zip, service } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleaners = await listCleaners({ zip, serviceType: service });

  const hasZipFilter = Boolean(zip?.trim());

  const ranked = cleaners
    .map((c) => ({
      cleaner: c,
      score: computeMatchScore(
        {
          current_tier: c.current_tier,
          average_rating: c.average_rating,
          current_score: c.current_score,
          review_count: c.review_count,
          is_veteran: c.is_veteran,
          zip_covered: c.zip_covered,
        },
        hasZipFilter,
      ),
    }))
    .sort((a, b) => b.score.total - a.score.total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Find a Cleaner</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse verified cleaners in Northern California.
        </p>
      </div>

      <Suspense>
        <CleanerFilters />
      </Suspense>

      {ranked.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No cleaners found{zip ? ` serving ZIP ${zip}` : ''}
          {service ? ` for ${service} cleaning` : ''}.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranked.map(({ cleaner, score }) => (
            <CleanerCard key={cleaner.id} cleaner={cleaner} score={score} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CleanersPage;
