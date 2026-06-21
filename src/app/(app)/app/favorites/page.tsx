import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';
import { rankBrowseCleaners } from '@/features/discovery/browse-ranking';
import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { getCustomerDiscoveryAnchor, listFavorites } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const FavoritesPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [anchor, favorites] = await Promise.all([getCustomerDiscoveryAnchor(), listFavorites()]);
  const ranked = rankBrowseCleaners(favorites, anchor, {
    services: [],
    max_miles: 25,
    min_rating: 0,
    sort: 'match',
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Favorites</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Your saved cleaners, ready to rebook.</p>
        </div>
        <Link
          href="/app/cleaners"
          className="flex-shrink-0 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          Browse
        </Link>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-tier1">
          <EmptyState
            showDash
            title="No favorites yet"
            description="Save cleaners you love from their profile page. They'll appear here for quick rebooking."
            action={{ label: 'Browse cleaners', href: '/app/cleaners' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranked.map(({ row, miles }) => (
            <CleanerCard key={row.id} cleaner={row} distanceMiles={miles} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
