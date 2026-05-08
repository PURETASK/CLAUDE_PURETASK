import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMyRecurringSchedules } from '@/features/recurring/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CADENCE_LABELS: Record<string, string> = {
  every_week: 'Weekly',
  every_2_weeks: 'Every 2 weeks',
  every_4_weeks: 'Every 4 weeks',
  every_8_weeks: 'Every 8 weeks',
  every_12_weeks: 'Every 12 weeks',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-amber-50 text-amber-700',
  ended_by_customer: 'bg-zinc-100 text-zinc-500',
  ended_by_cleaner: 'bg-zinc-100 text-zinc-500',
  ended_by_platform: 'bg-zinc-100 text-zinc-500',
};

export default async function RecurringPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const schedules = await getMyRecurringSchedules();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Recurring Cleanings</h1>
          <p className="text-sm text-zinc-500">Set-it-and-forget-it scheduled cleanings.</p>
        </div>
        <Link
          href="/app/cleaners"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + New schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="mb-3 text-sm text-zinc-500">No recurring schedules yet.</p>
          <Link href="/app/cleaners" className="text-sm font-medium text-zinc-900 underline">
            Browse cleaners to get started
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Link
              key={s.id}
              href={`/app/recurring/${s.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{s.cleaner_name}</p>
                  <p className="text-sm text-zinc-500">
                    {s.service_display_name} · {CADENCE_LABELS[s.cadence] ?? s.cadence}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{s.address_street}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s.status] ?? 'bg-zinc-100 text-zinc-500'}`}
                >
                  {s.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-400">
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
