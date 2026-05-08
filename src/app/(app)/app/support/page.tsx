import Link from 'next/link';

import { getMyTickets } from '@/features/support/queries';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  awaiting_customer: 'Awaiting you',
  awaiting_admin: 'Awaiting support',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  awaiting_customer: 'bg-amber-100 text-amber-700',
  awaiting_admin: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-zinc-100 text-zinc-500',
};

export default async function SupportPage() {
  const tickets = await getMyTickets();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Support</h1>
        <Link
          href="/app/support/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-zinc-100 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">No support tickets yet.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Need help? Open a ticket and we&#39;ll get back to you shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/app/support/${t.id}`}
              className="flex items-start justify-between rounded-xl border border-zinc-100 bg-white px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.subject}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t.ticket_number} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`ml-4 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}
              >
                {STATUS_LABELS[t.status] ?? t.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
