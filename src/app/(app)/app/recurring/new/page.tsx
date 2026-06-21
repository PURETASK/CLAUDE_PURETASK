import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { listServices } from '@/features/booking/queries';
import { getUserAddresses } from '@/features/customer/queries';
import { getCleanerProfile } from '@/features/discovery/queries';
import { createRecurringScheduleAction } from '@/features/recurring/actions';
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
  { value: 'every_2_weeks', label: 'Every 2 weeks', hint: 'Most popular for standard cleanings' },
  { value: 'every_week', label: 'Weekly', hint: 'Best for busy households or larger homes' },
  { value: 'every_4_weeks', label: 'Every 4 weeks', hint: 'Light maintenance schedule' },
  { value: 'every_8_weeks', label: 'Every 8 weeks', hint: 'Occasional deep refresh' },
];

const FIELD =
  'w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none';

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
      <div className="mx-auto w-full max-w-lg">
        <p className="text-sm text-neutral-500">
          {addresses.length === 0
            ? 'Add a service address before setting up recurring cleanings.'
            : 'This cleaner has no active services.'}
        </p>
        <Link
          href="/app/settings/addresses"
          className="mt-3 block text-sm font-medium text-brand-600"
        >
          Manage addresses →
        </Link>
      </div>
    );
  }

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  async function submitAction(formData: FormData): Promise<void> {
    'use server';
    await createRecurringScheduleAction({ ok: false, error: null }, formData);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/cleaners/${cleaner_id}`}
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to cleaner"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Set up recurring</h1>
          <p className="text-xs text-neutral-500">{cleaner.full_name}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Lock in regular cleanings.</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {cleaner.full_name} will hold your slot. Skip or cancel any single cleaning anytime.
        </p>
      </div>

      <form action={submitAction} className="flex flex-col gap-5">
        <input type="hidden" name="cleaner_id" value={cleaner_id} />

        {/* Cadence as radio cards (server-rendered, no JS needed) */}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-neutral-500">How often</legend>
          {CADENCE_OPTIONS.map((c, i) => (
            <label key={c.value} className="block cursor-pointer">
              <input
                type="radio"
                name="cadence"
                value={c.value}
                defaultChecked={i === 0}
                required
                className="peer sr-only"
              />
              <div className="rounded-xl border border-neutral-200 p-3 transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50/50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/30">
                <span className="block text-sm font-medium text-neutral-900">{c.label}</span>
                <span className="block text-xs text-neutral-500">{c.hint}</span>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">Service</label>
          <select name="service_id" required className={FIELD}>
            {offeredServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name} — ${((rates[s.service_type] ?? 0) / 100).toFixed(0)}/hr
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">Address</label>
          <select name="address_id" required className={FIELD}>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.street_1}, {a.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">Duration</label>
            <select name="duration_hours" required className={FIELD}>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map((h) => (
                <option key={h} value={h}>
                  {h} hr{h !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-500">Start time</label>
            <select name="start_minutes" defaultValue={480} required className={FIELD}>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">First cleaning</label>
          <input type="date" name="first_date" min={minDate} required className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-500">Notes (optional)</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Entry instructions, special requests…"
            className={FIELD}
          />
        </div>

        <p className="text-xs leading-relaxed text-neutral-400">
          Charged per cleaning, not upfront — you&apos;ll get a reminder 48 hours before each visit.
          Skip any cleaning up to 12 hours before, or cancel the schedule anytime.
        </p>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Start recurring
        </button>
      </form>
    </div>
  );
}
