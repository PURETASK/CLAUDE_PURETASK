import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getUserAddresses } from '@/features/customer/queries';
import { createRecurringScheduleAction } from '@/features/recurring/actions';
import { listServices } from '@/features/booking/queries';
import { getCleanerProfile } from '@/features/discovery/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PageProps = { searchParams: Promise<{ cleaner_id?: string }> };

const TIME_OPTIONS: { label: string; value: number }[] = [];
for (let m = 360; m <= 1320; m += 30) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  TIME_OPTIONS.push({ label: `${h12}:${min === 0 ? '00' : min} ${ampm}`, value: m });
}

const CADENCE_OPTIONS = [
  { label: 'Every week', value: 'every_week' },
  { label: 'Every 2 weeks', value: 'every_2_weeks' },
  { label: 'Every 4 weeks', value: 'every_4_weeks' },
  { label: 'Every 8 weeks', value: 'every_8_weeks' },
];

export default async function NewRecurringPage({ searchParams }: PageProps) {
  const { cleaner_id } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  if (!cleaner_id) redirect('/app/cleaners');

  const [cleaner, services, addresses] = await Promise.all([
    getCleanerProfile(cleaner_id),
    listServices(),
    getUserAddresses(),
  ]);

  if (!cleaner) notFound();

  const rates = cleaner.hourly_rates_cents as Record<string, number>;
  const offeredServices = services.filter((s) => (rates[s.service_type] ?? 0) > 0);

  if (offeredServices.length === 0 || addresses.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <p className="text-sm text-neutral-500">
          {addresses.length === 0
            ? 'Add a service address before setting up recurring cleanings.'
            : 'This cleaner has no active services.'}
        </p>
        <Link href="/settings/addresses" className="mt-3 block text-sm underline">
          Manage addresses
        </Link>
      </div>
    );
  }

  // Today + 1 day as the minimum first date
  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  async function submitAction(formData: FormData): Promise<void> {
    'use server';
    await createRecurringScheduleAction({ ok: false, error: null }, formData);
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="mb-8">
        <Link
          href={`/app/cleaners/${cleaner_id}`}
          className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← {cleaner.full_name}
        </Link>
        <h1 className="text-xl font-semibold">Set up recurring cleaning</h1>
        <p className="text-sm text-neutral-500">
          Schedule automatic cleanings with {cleaner.full_name} on a repeating cadence.
        </p>
      </div>

      <form action={submitAction} className="space-y-5">
        <input type="hidden" name="cleaner_id" value={cleaner_id} />

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Service</label>
          <select
            name="service_id"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {offeredServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name} — ${((rates[s.service_type] ?? 0) / 100).toFixed(0)}/hr
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Address</label>
          <select
            name="address_id"
            required
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.street_1}, {a.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Duration (hours)
            </label>
            <select
              name="duration_hours"
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map((h) => (
                <option key={h} value={h}>
                  {h} hr{h !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Start time</label>
            <select
              name="start_minutes"
              defaultValue={480}
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Cadence</label>
            <select
              name="cadence"
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              {CADENCE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">First date</label>
            <input
              type="date"
              name="first_date"
              min={minDate}
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Entry instructions, special requests…"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          Create recurring schedule
        </button>
      </form>
    </div>
  );
}
