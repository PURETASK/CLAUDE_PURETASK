'use client';

import { useEffect, useState } from 'react';

type Props = { vapidPublicKey: string };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSubscriptionToggle({ vapidPublicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSupported(true);

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const subscribe = async () => {
    setError(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (!res.ok) throw new Error('Failed to save subscription');
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable push notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-sm text-neutral-400">
        Push notifications are not supported by your browser.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-800">Browser push notifications</p>
          <p className="text-xs text-neutral-400">
            {subscribed
              ? 'You will receive push notifications on this device.'
              : 'Get notified instantly even when the app is in the background.'}
          </p>
        </div>
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`ml-4 inline-flex flex-shrink-0 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-control disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${
            subscribed
              ? 'border border-brand-600 bg-white text-brand-600 shadow-tier1 hover:bg-neutral-50 hover:shadow-tier2'
              : 'bg-gradient-brand text-white shadow-tier1 hover:brightness-110 hover:shadow-tier2'
          }`}
        >
          {loading ? '…' : subscribed ? 'Disable' : 'Enable'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
