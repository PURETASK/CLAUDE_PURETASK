import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTicketById } from '@/features/support/queries';
import { ReplyForm } from './ReplyForm';

type Props = { params: Promise<{ id: string }> };

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  awaiting_customer: 'bg-amber-100 text-amber-700',
  awaiting_admin: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-neutral-100 text-neutral-500',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  awaiting_customer: 'Awaiting you',
  awaiting_admin: 'Awaiting support',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default async function SupportTicketPage({ params }: Props) {
  const { id } = await params;
  const result = await getTicketById(id);
  if (!result) notFound();

  const { ticket, messages } = result;
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/app/support"
            className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← My tickets
          </Link>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <p className="mt-0.5 text-xs text-neutral-400">
            {ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`ml-4 mt-1 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open}`}
        >
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </span>
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-5 py-4 ${
              m.sender_role === 'customer'
                ? 'border border-neutral-100 bg-white'
                : 'border border-blue-100 bg-blue-50'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-600">
                {m.sender_role === 'customer' ? 'You' : 'PureTask Support'}
              </span>
              <span className="text-xs text-neutral-400">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-800">{m.body}</p>
          </div>
        ))}
      </div>

      {isClosed ? (
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium text-emerald-800">This ticket has been resolved.</p>
          {ticket.resolved_at && (
            <p className="mt-0.5 text-xs text-emerald-600">
              Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-neutral-100 bg-white px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold">Reply</h2>
          <ReplyForm ticketId={id} />
        </div>
      )}
    </div>
  );
}
