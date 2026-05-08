import Link from 'next/link';
import { notFound } from 'next/navigation';

import { addTimeOffAction, removeTimeOffAction } from '@/features/cleaner/availability-actions';
import { getMyAvailability } from '@/features/cleaner/availability-queries';

import { AvailabilityScheduleForm } from './AvailabilityScheduleForm';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function CleanerAvailabilityPage() {
  const data = await getMyAvailability();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/app/cleaner" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Availability</h1>
        <p className="text-sm text-zinc-500">
          Set your weekly schedule and block time off. Customers can only book during your active
          hours.
        </p>
      </div>

      {/* Weekly schedule */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Weekly schedule</h2>
        <AvailabilityScheduleForm initialRules={data.rules} />
      </section>

      {/* Time off */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900">Time off</h2>

        {data.timeOff.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-400">No upcoming time off blocks.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {data.timeOff.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {formatDate(block.blocked_start_at)} — {formatDate(block.blocked_end_at)}
                  </p>
                  {block.reason && <p className="text-xs text-zinc-500">{block.reason}</p>}
                </div>
                <form
                  action={async () => {
                    'use server';
                    await removeTimeOffAction(block.id);
                  }}
                >
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <AddTimeOffForm />
      </section>

      <Link href="/app/cleaner/settings" className="text-xs text-zinc-400 hover:text-zinc-600">
        ← Back to settings
      </Link>
    </div>
  );
}

function AddTimeOffForm() {
  return (
    <form action={addTimeOffAction} className="space-y-3">
      <p className="text-xs font-medium text-zinc-700">Add time off block</p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">From</label>
          <input
            type="date"
            name="start_date"
            required
            className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">To</label>
          <input
            type="date"
            name="end_date"
            required
            className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <input
        type="text"
        name="reason"
        placeholder="Reason (optional)"
        className="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Add block
      </button>
    </form>
  );
}
