import Link from 'next/link';

import { getMyCustomerReliabilityEvents } from '@/features/reliability/queries';

const EVENT_COLORS: Record<string, string> = {
  positive: 'text-emerald-600',
  neutral: 'text-neutral-500',
  negative: 'text-red-600',
};

function deltaColor(delta: number) {
  if (delta > 0) return EVENT_COLORS.positive;
  if (delta < 0) return EVENT_COLORS.negative;
  return EVENT_COLORS.neutral;
}

function formatEventType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CustomerReliabilityPage() {
  const events = await getMyCustomerReliabilityEvents();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link
          href="/app/dashboard"
          className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Your reliability record</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cleaners see this when reviewing your booking requests. On-time arrivals and completed
          bookings build a positive record.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-neutral-100 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">No reliability events yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Complete your first booking to start building your record.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between rounded-xl border border-neutral-100 bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{formatEventType(e.event_type)}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{e.description}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(e.event_occurred_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`ml-4 flex-shrink-0 text-sm font-semibold ${deltaColor(e.point_delta)}`}
              >
                {e.point_delta > 0 ? `+${e.point_delta}` : e.point_delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
