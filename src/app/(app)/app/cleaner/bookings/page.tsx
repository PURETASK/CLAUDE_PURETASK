import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMyBookingsAsCleaner, getMyCleanerProfileId } from '@/features/booking/queries';
import { JobCard } from '@/features/cleaner/components/JobCard';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ACTIVE = [
  'confirmed',
  'imminent',
  'in_transit',
  'arrived',
  'in_progress',
  'awaiting_approval',
];

const fmtPrice = (c: number) => `$${(c / 100).toFixed(0)}`;
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const CleanerJobsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const cleanerProfileId = await getMyCleanerProfileId();
  if (!cleanerProfileId) redirect('/cleaner/apply');

  const bookings = await getMyBookingsAsCleaner();
  const asc = (a: { start_at: string }, b: { start_at: string }) =>
    new Date(a.start_at).getTime() - new Date(b.start_at).getTime();

  const newReqs = bookings.filter((b) => b.state === 'booking_requested').sort(asc);
  const upcoming = bookings.filter((b) => ACTIVE.includes(b.state)).sort(asc);
  const past = bookings
    .filter((b) => b.state !== 'booking_requested' && !ACTIVE.includes(b.state))
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Jobs</h1>

      <section className="flex flex-col gap-3">
        <SectionHeader title={`New requests${newReqs.length ? ` · ${newReqs.length}` : ''}`} />
        {newReqs.length === 0 ? (
          <p className="text-sm text-neutral-400">No new requests right now.</p>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-neutral-500">
              You have 1 hour to decline a new booking free of penalty. After that, declining counts
              against your reliability score.
            </p>
            <div className="flex flex-col gap-3">
              {newReqs.map((b) => (
                <JobCard key={b.id} booking={b} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Upcoming" />
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">No upcoming jobs.</p>
        ) : (
          <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
            {upcoming.map((b) => (
              <ListRow
                key={b.id}
                href={`/app/cleaner/bookings/${b.id}`}
                title={`${b.service_display_name} · ${b.other_party_name}`}
                subtitle={`${fmtWhen(b.start_at)} · ${b.duration_hours_decimal} hrs · ${b.address_street}`}
                trailing={
                  <span className="text-sm font-semibold text-neutral-900">
                    {fmtPrice(b.cleaner_payout_cents)}
                  </span>
                }
              />
            ))}
          </Card>
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Past" />
          <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
            {past.slice(0, 15).map((b) => (
              <ListRow
                key={b.id}
                href={`/app/cleaner/bookings/${b.id}`}
                chevron={false}
                title={`${b.service_display_name} · ${b.other_party_name}`}
                subtitle={fmtWhen(b.start_at)}
                trailing={<StatusBadge status={b.state} />}
              />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};

export default CleanerJobsPage;
