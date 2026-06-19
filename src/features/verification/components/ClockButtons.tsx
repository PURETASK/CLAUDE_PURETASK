'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  clockInAction,
  clockOutAction,
  markArrivedAction,
  startTransitAction,
} from '@/features/verification/actions';

type Props = {
  bookingId: string;
  state: string;
};

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
    });
  });

export const ClockButtons = ({ bookingId, state }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error: string | null }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  if (state === 'confirmed' || state === 'imminent') {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => startTransitAction(bookingId))}
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? 'Starting…' : 'On my way'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === 'in_transit') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500">
          Tap when you arrive — we use your location to confirm you&apos;re at the address.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              try {
                const pos = await getPosition();
                return markArrivedAction(bookingId, pos.coords.latitude, pos.coords.longitude);
              } catch (e) {
                return {
                  ok: false,
                  error: e instanceof Error ? e.message : 'Location unavailable.',
                };
              }
            })
          }
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? 'Checking…' : "I've arrived"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === 'arrived') {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => clockInAction(bookingId))}
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? 'Clocking in…' : 'Clock in'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === 'in_progress') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500">
          Clock-out requires the minimum before + after photos for this service.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => clockOutAction(bookingId))}
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? 'Clocking out…' : 'Clock out'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
};
