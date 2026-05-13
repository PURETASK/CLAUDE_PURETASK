import Image from 'next/image';
import Link from 'next/link';

import { getMyTickets } from '@/features/support/queries';
import { BACKGROUNDS, ICONS } from '@/lib/assets';

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
  closed: 'bg-neutral-100 text-neutral-500',
};

export default async function SupportPage() {
  const tickets = await getMyTickets();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Support header with background */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
        <Image src={BACKGROUNDS.support} alt="" fill className="object-cover opacity-30" />
        <div className="relative z-10 flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Image
              src={ICONS.message}
              alt=""
              width={48}
              height={48}
              className="rounded-xl drop-shadow-md"
            />
            <h1 className="text-2xl font-bold text-neutral-900">Support</h1>
          </div>
          <Link
            href="/app/support/new"
            className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            New ticket
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-neutral-100 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">No support tickets yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Need help? Open a ticket and we&#39;ll get back to you shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/app/support/${t.id}`}
              className="flex items-start justify-between rounded-xl border border-neutral-100 bg-white px-5 py-4 transition-colors hover:bg-neutral-50"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{t.subject}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
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
