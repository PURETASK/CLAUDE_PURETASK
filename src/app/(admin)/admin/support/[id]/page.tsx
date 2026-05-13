import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTicketByIdForAdmin } from '@/features/support/queries';
import { AdminReplyForm } from './AdminReplyForm';
import { ResolveForm } from './ResolveForm';

type Props = { params: Promise<{ id: string }> };

const CATEGORY_LABELS: Record<string, string> = {
  account_access: 'Account access',
  billing_question: 'Billing question',
  app_bug: 'App bug',
  feature_request: 'Feature request',
  safety_concern: 'Safety concern',
  data_request: 'Data request',
  partnership: 'Partnership',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  awaiting_customer: 'bg-amber-100 text-amber-700',
  awaiting_admin: 'bg-red-100 text-red-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-neutral-100 text-neutral-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-neutral-100 text-neutral-600',
  low: 'bg-neutral-50 text-neutral-400',
};

export default async function AdminSupportDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getTicketByIdForAdmin(id);
  if (!result) notFound();

  const { ticket, messages } = result;
  const isOpen = !['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/admin/support"
            className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← Support queue
          </Link>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <p className="mt-0.5 text-xs text-neutral-400">{ticket.ticket_number}</p>
        </div>
        <div className="ml-4 mt-1 flex flex-shrink-0 gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.normal}`}
          >
            {ticket.priority}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open}`}
          >
            {ticket.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-100 p-4 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-neutral-400">Customer</dt>
          <dd className="font-medium">{ticket.submitter_name}</dd>
          <dt className="text-neutral-400">Email</dt>
          <dd>{ticket.submitter_email}</dd>
          <dt className="text-neutral-400">Category</dt>
          <dd>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</dd>
          <dt className="text-neutral-400">Filed</dt>
          <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
          {ticket.first_response_at && (
            <>
              <dt className="text-neutral-400">First response</dt>
              <dd>{new Date(ticket.first_response_at).toLocaleString()}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="mb-6 space-y-4">
        <h2 className="text-sm font-semibold">Conversation</h2>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-5 py-4 ${
              m.is_internal_note
                ? 'border border-amber-200 bg-amber-50'
                : m.sender_role === 'admin'
                  ? 'border border-blue-100 bg-blue-50'
                  : 'border border-neutral-100 bg-white'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600">
                {m.is_internal_note
                  ? '🔒 Internal note'
                  : m.sender_role === 'admin'
                    ? 'Support admin'
                    : 'Customer'}
              </span>
              <span className="text-xs text-neutral-400">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-800">{m.body}</p>
          </div>
        ))}
      </div>

      {isOpen && (
        <>
          <div className="mb-6 rounded-xl border border-neutral-100 bg-white px-5 py-5">
            <h2 className="mb-4 text-sm font-semibold">Reply</h2>
            <AdminReplyForm ticketId={id} />
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-5">
            <h2 className="mb-4 text-sm font-semibold text-emerald-800">Resolve ticket</h2>
            <ResolveForm ticketId={id} />
          </div>
        </>
      )}

      {!isOpen && ticket.resolution_notes && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-800">Resolution notes</p>
          <p className="mt-1 text-sm text-emerald-700">{ticket.resolution_notes}</p>
        </div>
      )}
    </div>
  );
}
