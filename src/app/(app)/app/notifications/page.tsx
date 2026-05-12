import Image from 'next/image';
import Link from 'next/link';

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/features/notifications/actions';
import { getRecentNotifications, type NotificationRow } from '@/features/notifications/queries';
import { ICONS } from '@/lib/assets';

const TABS = ['All', 'Bookings', 'Payments', 'Disputes', 'System'] as const;
type Tab = (typeof TABS)[number];

function getCategory(type: string): Tab {
  if (type.includes('booking') || type.includes('schedule') || type.includes('job')) return 'Bookings';
  if (type.includes('payment') || type.includes('payout') || type.includes('tip') || type.includes('earn')) return 'Payments';
  if (type.includes('dispute') || type.includes('refund')) return 'Disputes';
  return 'System';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationItem({ n }: { n: NotificationRow }) {
  return (
    <div className={`flex gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 ${!n.read_at ? 'bg-brand-600/5' : ''}`}>
      <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${!n.read_at ? 'bg-brand-600' : 'bg-transparent'}`} />
      <div className="min-w-0 flex-1">
        {n.deep_link ? (
          <Link href={n.deep_link}>
            <p className="text-sm font-medium text-neutral-900">{n.title}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{n.body}</p>
          </Link>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-900">{n.title}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{n.body}</p>
          </>
        )}
        <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
      </div>
      {!n.read_at && (
        <form action={markNotificationReadAction.bind(null, n.id)}>
          <button
            type="submit"
            className="flex-shrink-0 text-xs text-neutral-400 transition-colors hover:text-neutral-700"
          >
            Mark read
          </button>
        </form>
      )}
    </div>
  );
}

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function NotificationsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab: Tab = (TABS.find((t) => t === tab) ?? 'All') as Tab;

  const all = await getRecentNotifications(100);

  const filtered =
    activeTab === 'All' ? all : all.filter((n) => getCategory(n.notification_type) === activeTab);

  const unreadCounts: Record<Tab, number> = {
    All: all.filter((n) => !n.read_at).length,
    Bookings: all.filter((n) => !n.read_at && getCategory(n.notification_type) === 'Bookings').length,
    Payments: all.filter((n) => !n.read_at && getCategory(n.notification_type) === 'Payments').length,
    Disputes: all.filter((n) => !n.read_at && getCategory(n.notification_type) === 'Disputes').length,
    System: all.filter((n) => !n.read_at && getCategory(n.notification_type) === 'System').length,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src={ICONS.notification} alt="" width={48} height={48} className="rounded-xl drop-shadow-md" />
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
        </div>
        {unreadCounts.All > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-neutral-50"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-tier1">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === 'All' ? '/app/notifications' : `/app/notifications?tab=${t}`}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === t
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            {t}
            {unreadCounts[t] > 0 && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  activeTab === t ? 'bg-white/25 text-white' : 'bg-brand-600 text-white'
                }`}
              >
                {unreadCounts[t]}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-tier1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Image src={ICONS.notification} alt="" width={48} height={48} className="rounded-xl opacity-30" />
            <p className="text-sm text-neutral-400">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
