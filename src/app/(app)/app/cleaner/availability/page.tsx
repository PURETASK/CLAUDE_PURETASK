import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { addTimeOffAction, removeTimeOffAction } from '@/features/cleaner/availability-actions';
import { getMyAvailability } from '@/features/cleaner/availability-queries';
import { getMyServiceArea } from '@/features/cleaner/service-area-queries';

import { AvailabilityScheduleForm } from './AvailabilityScheduleForm';
import { ServiceAreaForm } from './ServiceAreaForm';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const FIELD =
  'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none';

export default async function CleanerAvailabilityPage() {
  const [data, serviceArea] = await Promise.all([getMyAvailability(), getMyServiceArea()]);
  if (!data) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/cleaner"
            className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Availability</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Set your weekly schedule and block time off. Customers can only book during your active
          hours.
        </p>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-5">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Service area</h2>
        <ServiceAreaForm initialZips={serviceArea?.zips ?? []} />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Weekly schedule</h2>
        <AvailabilityScheduleForm initialRules={data.rules} />
      </section>

      <Card elevation={1} className="border border-neutral-200 p-5">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Time off</h2>

        {data.timeOff.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-400">No upcoming time off blocks.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {data.timeOff.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {formatDate(block.blocked_start_at)} — {formatDate(block.blocked_end_at)}
                  </p>
                  {block.reason && <p className="text-xs text-neutral-500">{block.reason}</p>}
                </div>
                <form
                  action={async () => {
                    'use server';
                    await removeTimeOffAction(block.id);
                  }}
                >
                  <button type="submit" className="text-xs font-medium text-error hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addTimeOffAction} className="flex flex-col gap-3">
          <p className="text-xs font-medium text-neutral-700">Add time off block</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">From</label>
              <input type="date" name="start_date" required className={FIELD} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-neutral-500">To</label>
              <input type="date" name="end_date" required className={FIELD} />
            </div>
          </div>
          <input type="text" name="reason" placeholder="Reason (optional)" className={FIELD} />
          <button
            type="submit"
            className="self-start rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Add block
          </button>
        </form>
      </Card>
    </div>
  );
}
