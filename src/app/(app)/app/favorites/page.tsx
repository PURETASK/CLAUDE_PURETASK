import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { rankBrowseCleaners } from '@/features/discovery/browse-ranking';
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Favorite Cleaners</h1>
        <Link href="/app/cleaners" className="text-sm font-medium underline">
          Browse cleaners
        </Link>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm text-zinc-500">
          You have no favorites yet. Save a cleaner from their profile.
        </p>
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

export default FavoritesPage;
