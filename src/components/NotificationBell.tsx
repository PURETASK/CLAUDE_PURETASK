'use client';

import { useEffect, useRef, useState } from 'react';

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/features/notifications/actions';
import type { NotificationRow } from '@/features/notifications/queries';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Props = {
  initialNotifications: NotificationRow[];
  userId: string;
};

export function NotificationBell({ initialNotifications, userId }: Props) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        if (res.ok) {
          const data = (await res.json()) as NotificationRow[];
          setNotifications(data);
        }
      } catch {
        // silent — polling is best-effort
      }
    };

    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [userId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    await markNotificationReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
    );
    await markAllNotificationsReadAction();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-1.5 text-neutral-600 transition-colors duration-control hover:bg-neutral-100"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-neutral-200 bg-white shadow-tier2">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-neutral-400 transition-colors duration-control hover:text-neutral-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 ${!n.read_at ? 'bg-brand-600/5' : ''}`}
                >
                  <div
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!n.read_at ? 'bg-brand-600' : 'bg-transparent'}`}
                  />
                  <div className="min-w-0 flex-1">
                    {n.deep_link ? (
                      <a href={n.deep_link} onClick={() => handleMarkRead(n.id)} className="block">
                        <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
                      </a>
                    ) : (
                      <div onClick={() => handleMarkRead(n.id)} className="cursor-default">
                        <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-neutral-100 px-4 py-2">
            <a
              href="/app/notifications"
              className="block text-center text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
