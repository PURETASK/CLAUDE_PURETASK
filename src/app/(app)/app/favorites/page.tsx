import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';

import { CleanerCard } from '@/features/discovery/components/CleanerCard';
import { rankBrowseCleaners } from '@/features/discovery/browse-ranking';
import { getCustomerDiscoveryAnchor, listFavorites } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ICONS } from '@/lib/assets';

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
        <div className="flex items-center gap-3">
          <Image src={ICONS.contacts} alt="" width={52} height={52} className="rounded-xl drop-shadow-md" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Favorites</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Your saved cleaners, ready to rebook.</p>
          </div>
        </div>
        <Link href="/app/cleaners" className="text-sm font-medium underline">
          Browse cleaners
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
          {ranked.map(({ row, transparency, miles }) => (
            <CleanerCard key={row.id} cleaner={row} score={transparency} distanceMiles={miles} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
