import Link from 'next/link';

import { getOpenDisputesForAdmin } from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';

export default async function AdminDisputesPage() {
  const disputes = await getOpenDisputesForAdmin();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Disputes</h1>

      {disputes.length === 0 ? (
        <p className="text-sm text-neutral-400">No open disputes.</p>
      ) : (
        <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
          {disputes.map((d) => (
            <Link
              key={d.id}
              href={`/admin/disputes/${d.id}`}
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{d.booking_number}</p>
                <p className="text-xs text-neutral-500">
                  {d.customer_name} → {d.cleaner_name}
                </p>
                <p className="text-xs text-neutral-400">
                  {ISSUE_CATEGORY_LABELS[d.issue_category] ?? d.issue_category}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-1">
                <DisputeStateBadge state={d.state} />
                <span className="text-xs text-neutral-400">
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
