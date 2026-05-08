import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDisputeById, getDisputeMessages } from '@/features/disputes/queries';
import { DisputeStateBadge } from '@/features/disputes/components/DisputeStateBadge';
import { DisputeThread } from '@/features/disputes/components/DisputeThread';
import { AdminResolveForm } from '@/features/disputes/components/AdminResolveForm';
import {
  DESIRED_OUTCOME_LABELS,
  ISSUE_CATEGORY_LABELS,
  RESPONSE_TYPE_LABELS,
} from '@/features/disputes/validation';

type Props = { params: Promise<{ id: string }> };

export default async function AdminDisputeDetailPage({ params }: Props) {
  const { id } = await params;
  const dispute = await getDisputeById(id);
  if (!dispute) notFound();

  const messages = await getDisputeMessages(id);

  const isOpen = ['open', 'cleaner_responded', 'escalated', 'in_mediation'].includes(dispute.state);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/app/admin/disputes"
            className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600"
          >
            ← All disputes
          </Link>
          <h1 className="text-xl font-semibold">Dispute — {dispute.booking_number}</h1>
        </div>
        <DisputeStateBadge state={dispute.state} />
      </div>

      <div className="mb-6 rounded-lg border border-zinc-100 p-4 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-zinc-400">Customer</dt>
          <dd className="font-medium">{dispute.customer_name}</dd>
          <dt className="text-zinc-400">Cleaner</dt>
          <dd className="font-medium">{dispute.cleaner_name}</dd>
          <dt className="text-zinc-400">Issue</dt>
          <dd>{ISSUE_CATEGORY_LABELS[dispute.issue_category] ?? dispute.issue_category}</dd>
          <dt className="text-zinc-400">Customer wanted</dt>
          <dd>
            {DESIRED_OUTCOME_LABELS[dispute.customer_desired_outcome] ??
              dispute.customer_desired_outcome}
          </dd>
          {dispute.cleaner_response_type && (
            <>
              <dt className="text-zinc-400">Cleaner offered</dt>
              <dd>
                {RESPONSE_TYPE_LABELS[dispute.cleaner_response_type] ??
                  dispute.cleaner_response_type}
              </dd>
            </>
          )}
          <dt className="text-zinc-400">Filed</dt>
          <dd>{new Date(dispute.created_at).toLocaleString()}</dd>
        </dl>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Conversation</h2>
        <DisputeThread messages={messages} viewerRole="admin" />
      </div>

      {isOpen && (
        <div className="rounded-lg border border-zinc-100 p-4">
          <h2 className="mb-4 text-sm font-semibold">Admin resolution</h2>
          <AdminResolveForm disputeId={id} />
        </div>
      )}

      {['mutually_resolved', 'admin_resolved'].includes(dispute.state) && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Resolved: {dispute.resolution_type}
          </p>
          {dispute.resolution_notes && (
            <p className="mt-1 text-sm text-emerald-700">{dispute.resolution_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
