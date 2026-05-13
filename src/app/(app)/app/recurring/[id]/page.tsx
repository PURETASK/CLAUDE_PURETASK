import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  endScheduleAction,
  pauseScheduleAction,
  resumeScheduleAction,
  skipOccurrenceAction,
} from '@/features/recurring/actions';
import { getRecurringScheduleById } from '@/features/recurring/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { params: Promise<{ id: string }> };

const CADENCE_LABELS: Record<string, string> = {
  every_week: 'Weekly',
  every_2_weeks: 'Every 2 weeks',
  every_4_weeks: 'Every 4 weeks',
  every_8_weeks: 'Every 8 weeks',
  every_12_weeks: 'Every 12 weeks',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m === 0 ? '00' : m} ${ampm}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const OCCURRENCE_STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-neutral-100 text-neutral-600',
  spawned: 'bg-blue-50 text-blue-700',
  skipped: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-600',
  rescheduled: 'bg-purple-50 text-purple-700',
};

export default async function RecurringDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const data = await getRecurringScheduleById(id);
  if (!data) notFound();

  const { schedule, occurrences } = data;
  const isActive = schedule.status === 'active';
  const isPaused = schedule.status === 'paused';
  const isEnded = schedule.status.startsWith('ended');

  const upcomingOccurrences = occurrences
    .filter((o) => o.status === 'scheduled' && new Date(o.scheduled_start_at) > new Date())
    .slice(0, 10);

  const pastOccurrences = occurrences
    .filter((o) => o.status !== 'scheduled' || new Date(o.scheduled_start_at) <= new Date())
    .slice(-10)
    .reverse();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/app/recurring"
          className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← Recurring cleanings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{schedule.cleaner_name}</h1>
            <p className="text-sm text-neutral-500">
              {schedule.service_display_name} ·{' '}
              {CADENCE_LABELS[schedule.cadence] ?? schedule.cadence}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {DAYS[schedule.day_of_week]}s at {fmtTime(schedule.start_minutes)} ·{' '}
              {schedule.duration_hours_decimal} hrs · $
              {((schedule.hourly_rate_cents * schedule.duration_hours_decimal) / 100).toFixed(0)}
              /session
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              isActive
                ? 'bg-green-50 text-green-700'
                : isPaused
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {schedule.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!isEnded && (
        <section className="mb-6 flex gap-2">
          {isActive && (
            <form
              action={async () => {
                'use server';
                await pauseScheduleAction(id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Pause schedule
              </button>
            </form>
          )}
          {isPaused && (
            <form
              action={async () => {
                'use server';
                await resumeScheduleAction(id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Resume schedule
              </button>
            </form>
          )}
          <form
            action={async () => {
              'use server';
              await endScheduleAction(id);
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              End schedule
            </button>
          </form>
        </section>
      )}

      {/* Upcoming */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Upcoming sessions</h2>
        {upcomingOccurrences.length === 0 ? (
          <p className="text-sm text-neutral-400">No upcoming sessions.</p>
        ) : (
          <div className="space-y-2">
            {upcomingOccurrences.map((occ) => (
              <div
                key={occ.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {fmtDate(occ.scheduled_start_at)}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {fmtTime(schedule.start_minutes)} · {schedule.duration_hours_decimal} hrs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${OCCURRENCE_STATUS_STYLES[occ.status] ?? ''}`}
                  >
                    {occ.status}
                  </span>
                  {occ.status === 'scheduled' && isActive && (
                    <form
                      action={async () => {
                        'use server';
                        await skipOccurrenceAction(occ.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-neutral-400 hover:text-neutral-700"
                      >
                        Skip
                      </button>
                    </form>
                  )}
                  {occ.booking_id && (
                    <Link
                      href={`/app/bookings/${occ.booking_id}`}
                      className="text-xs text-neutral-400 underline hover:text-neutral-700"
                    >
                      Booking
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {pastOccurrences.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">History</h2>
          <div className="space-y-2">
            {pastOccurrences.map((occ) => (
              <div
                key={occ.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white px-4 py-2.5"
              >
                <p className="text-sm text-neutral-600">{fmtDate(occ.scheduled_start_at)}</p>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${OCCURRENCE_STATUS_STYLES[occ.status] ?? ''}`}
                  >
                    {occ.status}
                  </span>
                  {occ.booking_id && (
                    <Link
                      href={`/app/bookings/${occ.booking_id}`}
                      className="text-xs text-neutral-400 underline hover:text-neutral-700"
                    >
                      Booking
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 rounded-lg bg-neutral-50 p-4 text-xs text-neutral-400">
        <p>
          Started {fmtDate(schedule.started_at)} · {schedule.occurrences_completed_count} sessions
          completed
        </p>
        {schedule.customer_notes && <p className="mt-1">{schedule.customer_notes}</p>}
      </div>
    </div>
  );
}
