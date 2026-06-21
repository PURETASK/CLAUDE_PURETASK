import { Calendar, MessageSquare, Repeat, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { ICONS } from '@/lib/assets';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function relativeDay(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days > 1) return `in ${days} days`;
  if (days === -1) return 'yesterday';
  if (days < -1 && days > -31) return `${Math.abs(days)} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const CHIP =
  'flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50';

const CustomerDashboardPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const bookings = await getMyBookingsAsCustomer();

  const upcoming = bookings
    .filter(
      (b) =>
        ['confirmed', 'on_my_way', 'active'].includes(b.state) && new Date(b.start_at) > new Date(),
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  const completed = bookings.filter((b) => b.state === 'completed');
  const nextBooking = upcoming[0] ?? null;

  // Cleaners booked most often → "Book again" carousel + recurring nudge.
  const byCleaner = new Map<
    string,
    { name: string; count: number; last: (typeof completed)[number] }
  >();
  for (const b of completed) {
    if (b.other_party_name === 'Cleaner TBD') continue;
    const entry = byCleaner.get(b.other_party_name);
    if (entry) entry.count += 1;
    else byCleaner.set(b.other_party_name, { name: b.other_party_name, count: 1, last: b });
  }
  const repeatCleaners = [...byCleaner.values()].sort((a, b) => b.count - a.count);
  const nudgeCleaner = repeatCleaners.find((c) => c.count >= 3) ?? null;

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  const hasActivity = bookings.length > 0;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm text-neutral-500">Welcome back</p>
        <h1 className="text-2xl font-bold text-neutral-900">{firstName}</h1>
      </div>

      {!hasActivity ? (
        <Card elevation={1} className="border border-neutral-200">
          <EmptyState
            showDash
            title="No cleanings yet"
            description="Find a trusted cleaner in your area and book your first clean."
            action={{ label: 'Find a cleaner', href: '/app/cleaners' }}
          />
        </Card>
      ) : (
        <>
          {/* Next cleaning */}
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Next cleaning"
              action={{ label: 'All bookings', href: '/app/bookings' }}
            />
            {nextBooking ? (
              <Card elevation={1} className="overflow-hidden border border-neutral-200">
                <Link
                  href={`/app/bookings/${nextBooking.id}`}
                  className="block border-l-[3px] border-brand-600 p-4 transition-colors hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-brand-600">
                        {relativeDay(nextBooking.start_at)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">
                        {nextBooking.service_display_name} with {nextBooking.other_party_name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatDateTime(nextBooking.start_at)}
                      </p>
                    </div>
                    <StatusBadge status={nextBooking.state} />
                  </div>
                </Link>
                <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 py-3">
                  <Link href={`/app/bookings/${nextBooking.id}/reschedule`} className={CHIP}>
                    <Calendar className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Reschedule
                  </Link>
                  <Link href={`/app/bookings/${nextBooking.id}/messages`} className={CHIP}>
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Message
                  </Link>
                  <Link href={`/app/bookings/${nextBooking.id}/cancel`} className={CHIP}>
                    <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Cancel
                  </Link>
                </div>
              </Card>
            ) : (
              <Card elevation={1} className="border border-dashed border-neutral-300">
                <div className="flex items-center justify-between gap-4 p-4">
                  <p className="text-sm text-neutral-500">No upcoming cleanings.</p>
                  <Link
                    href="/app/cleaners"
                    className="flex-shrink-0 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
                  >
                    Book one
                  </Link>
                </div>
              </Card>
            )}
          </section>

          {/* Book again */}
          {repeatCleaners.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Book again"
                action={{ label: 'All cleaners', href: '/app/cleaners' }}
              />
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {repeatCleaners.slice(0, 6).map((c) => (
                  <Card
                    key={c.name}
                    elevation={1}
                    className="w-40 flex-shrink-0 border border-neutral-200 p-3"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Image
                        src={ICONS.contacts}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-neutral-200"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">{c.name}</p>
                        <p className="truncate text-xs text-neutral-400">
                          {c.last.service_display_name}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/app/cleaners"
                      className="block rounded-lg bg-brand-600 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Rebook
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recurring nudge */}
          {nudgeCleaner && (
            <Card elevation={1} className="border border-brand-200 bg-brand-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Repeat className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    Set up recurring with {nudgeCleaner.name}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    You&apos;ve booked {nudgeCleaner.name} {nudgeCleaner.count} times. Lock in a
                    schedule and never think about it again.
                  </p>
                  <Link
                    href="/app/recurring/new"
                    className="mt-3 inline-block rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    See options
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Recent cleanings */}
          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader
                title="Recent cleanings"
                action={{ label: 'View all', href: '/app/bookings' }}
              />
              <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
                {completed.slice(0, 4).map((b) => (
                  <ListRow
                    key={b.id}
                    href={`/app/bookings/${b.id}`}
                    leading={
                      <Image
                        src={ICONS.contacts}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg border border-neutral-200"
                      />
                    }
                    title={`${b.service_display_name} with ${b.other_party_name}`}
                    subtitle={`${relativeDay(b.start_at)} · ${formatCents(b.total_charge_cents)}`}
                  />
                ))}
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerDashboardPage;
