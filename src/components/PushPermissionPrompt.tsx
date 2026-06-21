'use client';

import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'pt-push-prompt-dismissed';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * First-run, dismissible prompt to opt into web push. Renders nothing unless the
 * browser supports push, permission is still 'default', the user hasn't already
 * subscribed, and they haven't dismissed it before. Reuses the same subscribe
 * flow as PushSubscriptionToggle (POST /api/push/subscribe).
 */
export function PushPermissionPrompt({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    )
      return;
    if (Notification.permission !== 'default') return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* localStorage unavailable — show prompt anyway */
    }

    let cancelled = false;
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled && !sub) setVisible(true);
      })
      .catch(() => {
        /* no service worker — stay hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const remember = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const dismiss = () => {
    remember();
    setVisible(false);
  };

  const enable = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
    } catch {
      /* user denied or subscribe failed — don't nag again */
    } finally {
      remember();
      setLoading(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 md:inset-x-auto md:bottom-4 md:right-4 md:px-0">
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier2">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <Bell className="h-5 w-5 text-brand-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">Turn on notifications</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Get instant updates on bookings, messages, and payouts — even when the app is closed.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={enable}
              disabled={loading}
              className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Enabling…' : 'Enable'}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={loading}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
