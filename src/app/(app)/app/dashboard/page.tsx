import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { listFavorites } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CustomerDashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [bookings, favorites] = await Promise.all([getMyBookingsAsCustomer(), listFavorites()]);
  const previewFavorites = favorites.slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-slate-900">Customer Dashboard</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Active bookings</h2>
        <p className="mt-1 text-sm text-slate-500">
          {bookings.length > 0
            ? 'Your upcoming bookings are in My Bookings.'
            : 'No active bookings yet — your first one will appear here.'}
        </p>
        <Link href="/app/bookings" className="mt-3 inline-block text-sm font-medium underline">
          Open bookings
        </Link>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Past bookings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Completed bookings and receipts will appear here as you build history.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Favorites</h2>
          <Link href="/app/favorites" className="text-sm font-medium underline">
            View all
          </Link>
        </div>
        {previewFavorites.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">
            Save cleaners from profiles and they will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {previewFavorites.map((fav) => (
              <li key={fav.id}>
                <Link href={`/app/cleaners/${fav.id}`} className="underline">
                  {fav.full_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Reliability record</h2>
          <Link href="/app/dashboard/reliability" className="text-sm font-medium underline">
            View
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          On-time arrivals and completed bookings build your reliability record, visible to cleaners
          when they review your requests.
        </p>
      </section>
    </div>
  );
};

export default CustomerDashboardPage;
