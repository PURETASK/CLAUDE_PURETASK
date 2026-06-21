import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMyRecurringSchedules } from '@/features/recurring/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CADENCE_LABELS: Record<string, string> = {
  every_week: 'Weekly',
  every_2_weeks: 'Every 2 weeks',
  every_4_weeks: 'Every 4 weeks',
  every_8_weeks: 'Every 8 weeks',
  every_12_weeks: 'Every 12 weeks',
};

export default async function RecurringPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const schedules = await getMyRecurringSchedules();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Recurring</h1>
          <p className="text-sm text-neutral-500">Set-and-forget scheduled cleanings.</p>
        </div>
        <Link
          href="/app/cleaners"
          className="flex-shrink-0 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          New schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <Card elevation={1} className="border border-neutral-200">
          <EmptyState
            showDash
            title="No recurring schedules yet"
            description="Pick a cleaner you love and lock in a repeating slot."
            action={{ label: 'Browse cleaners', href: '/app/cleaners' }}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.map((s) => (
            <Link
              key={s.id}
              href={`/app/recurring/${s.id}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 transition-all duration-card hover:-translate-y-0.5 hover:shadow-tier2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {s.cleaner_name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {s.service_display_name} · {CADENCE_LABELS[s.cadence] ?? s.cadence}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{s.address_street}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-neutral-400">
                <span>{s.occurrences_completed_count} completed</span>
                <span>
                  ${((s.hourly_rate_cents * s.duration_hours_decimal) / 100).toFixed(0)}/session
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
