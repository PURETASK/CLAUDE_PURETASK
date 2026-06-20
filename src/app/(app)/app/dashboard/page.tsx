import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { listFavorites } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardBubbleAmbience } from '@/features/experience/components/DashboardBubbleAmbience';
import { BRAND, ICONS } from '@/lib/assets';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const CustomerDashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [bookings, favorites] = await Promise.all([getMyBookingsAsCustomer(), listFavorites()]);

  const upcoming = bookings
    .filter(
      (b) =>
        ['confirmed', 'on_my_way', 'active'].includes(b.state) && new Date(b.start_at) > new Date(),
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const completed = bookings.filter((b) => b.state === 'completed');
  const nextBooking = upcoming[0] ?? null;

  const totalSpent = completed.reduce((acc, b) => acc + b.total_charge_cents, 0);

  const recentCleaners = Array.from(
    new Map(
      completed
        .filter((b) => b.other_party_name !== 'Cleaner TBD')
        .map((b) => [b.other_party_name, b]),
    ).values(),
  ).slice(0, 3);

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  return (
    <div className="relative flex flex-col gap-6">
      <DashboardBubbleAmbience />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Image src={ICONS.home} alt="" width={36} height={36} className="rounded-xl" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Hey, {firstName}</h1>
            <p className="text-sm text-neutral-500">Welcome back to PureTask</p>
          </div>
        </div>

        {nextBooking ? (
          <Link
            href={`/app/bookings/${nextBooking.id}`}
            className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5 shadow-tier1 transition-all hover:shadow-tier2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Your next cleaning
                </p>
                <p className="mt-1 text-lg font-bold text-neutral-900">
                  {nextBooking.service_display_name}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  with {nextBooking.other_party_name}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Image src={ICONS.calendar} alt="" width={16} height={16} className="rounded" />
                  {formatDate(nextBooking.start_at)}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  nextBooking.state === 'confirmed'
                    ? 'bg-success/15 text-success'
                    : 'bg-brand-100 text-brand-700'
                }`}
              >
                {nextBooking.state.replace(/_/g, ' ')}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center shadow-tier1">
            <Image src={BRAND.dash} alt="Dash" width={64} height={64} className="opacity-80" />
            <div>
              <p className="font-semibold text-neutral-700">No upcoming cleanings</p>
              <p className="mt-1 text-sm text-neutral-400">Ready when you are.</p>
            </div>
            <Link
              href="/app/cleaners"
              className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
            >
              Find a cleaner
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 text-center">
            <p className="text-2xl font-bold text-neutral-900">{bookings.length}</p>
            <p className="mt-0.5 text-xs text-neutral-500">Total bookings</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 text-center">
            <p className="text-2xl font-bold text-neutral-900">{completed.length}</p>
            <p className="mt-0.5 text-xs text-neutral-500">Completed</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 text-center">
            <p className="text-2xl font-bold text-neutral-900">{formatCents(totalSpent)}</p>
            <p className="mt-0.5 text-xs text-neutral-500">Total spent</p>
          </div>
        </div>

        {recentCleaners.length > 0 && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">Book again</h2>
              <Link
                href="/app/cleaners"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Find more
              </Link>
            </div>
            <div className="space-y-3">
              {recentCleaners.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={ICONS.contacts}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full border border-neutral-200"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{b.other_party_name}</p>
                      <p className="text-xs text-neutral-400">{b.service_display_name}</p>
                    </div>
                  </div>
                  <Link
                    href="/app/cleaners"
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-all hover:bg-brand-100"
                  >
                    Book again
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 1 && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src={ICONS.calendar} alt="" width={20} height={20} className="rounded" />
                <h2 className="font-semibold text-neutral-900">Upcoming</h2>
              </div>
              <Link
                href="/app/bookings"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {upcoming.slice(1, 4).map((b) => (
                <Link
                  key={b.id}
                  href={`/app/bookings/${b.id}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 transition-all hover:border-neutral-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{b.service_display_name}</p>
                    <p className="text-xs text-neutral-400">{formatDate(b.start_at)}</p>
                  </div>
                  <span className="text-xs font-semibold capitalize text-neutral-500">
                    {b.state.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/app/cleaners"
            className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 transition-all hover:shadow-tier2"
          >
            <Image src={ICONS.cleaning} alt="" width={32} height={32} className="rounded-xl" />
            <p className="text-sm font-semibold text-neutral-900">Find a cleaner</p>
          </Link>
          <Link
            href="/app/favorites"
            className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 transition-all hover:shadow-tier2"
          >
            <Image src={ICONS.contacts} alt="" width={32} height={32} className="rounded-xl" />
            <p className="text-sm font-semibold text-neutral-900">Favorites</p>
            {favorites.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {favorites.length} saved
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
