import Link from 'next/link';

import { getAllTicketsForAdmin } from '@/features/support/queries';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  awaiting_customer: 'bg-amber-100 text-amber-700',
  awaiting_admin: 'bg-red-100 text-red-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-zinc-100 text-zinc-500',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  awaiting_customer: 'Awaiting customer',
  awaiting_admin: 'Needs reply',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-zinc-100 text-zinc-500',
  low: 'bg-zinc-50 text-zinc-400',
};

export default async function AdminSupportPage() {
  const tickets = await getAllTicketsForAdmin();

  const open = tickets.filter((t) => !['resolved', 'closed'].includes(t.status));
  const closed = tickets.filter((t) => ['resolved', 'closed'].includes(t.status));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold">Support queue</h1>

      {open.length === 0 && (
        <p className="mb-6 text-sm text-zinc-400">No open tickets. All clear!</p>
      )}

      {open.length > 0 && (
        <div className="mb-10 space-y-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Open ({open.length})
          </h2>
          {open.map((t) => (
            <Link
              key={t.id}
              href={`/app/admin/support/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{t.subject}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t.ticket_number} · {t.submitter_email} ·{' '}
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.normal}`}
                >
                  {t.priority}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}
                >
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Resolved / Closed ({closed.length})
          </h2>
          <div className="space-y-2">
            {closed.map((t) => (
              <Link
                key={t.id}
                href={`/app/admin/support/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-5 py-4 opacity-60 transition-colors hover:opacity-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {t.ticket_number} · {t.submitter_email}
                  </p>
                </div>
                <span
                  className={`ml-4 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? STATUS_COLORS.closed}`}
                >
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
