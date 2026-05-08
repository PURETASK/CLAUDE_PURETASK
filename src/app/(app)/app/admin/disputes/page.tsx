import Link from 'next/link';

import { getOpenDisputesForAdmin } from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';

export default async function AdminDisputesPage() {
  const disputes = await getOpenDisputesForAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Disputes</h1>

      {disputes.length === 0 ? (
        <p className="text-sm text-zinc-400">No open disputes.</p>
      ) : (
        <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
          {disputes.map((d) => (
            <Link
              key={d.id}
              href={`/app/admin/disputes/${d.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{d.booking_number}</p>
                <p className="text-xs text-zinc-500">
                  {d.customer_name} → {d.cleaner_name}
                </p>
                <p className="text-xs text-zinc-400">
                  {ISSUE_CATEGORY_LABELS[d.issue_category] ?? d.issue_category}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-1">
                <DisputeStateBadge state={d.state} />
                <span className="text-xs text-zinc-400">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
