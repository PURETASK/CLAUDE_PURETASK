'use client';

import { useActionState, useEffect, useState } from 'react';

import {
  saveServiceAreaAction,
  type ServiceAreaActionState,
} from '@/features/cleaner/service-area-actions';

const INITIAL: ServiceAreaActionState = { ok: false, error: null };

export function ServiceAreaForm({ initialZips }: { initialZips: string[] }) {
  const [state, action, pending] = useActionState(saveServiceAreaAction, INITIAL);
  const [value, setValue] = useState(initialZips.join(' '));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  const preview = Array.from(new Set(value.match(/\d{5}/g) ?? []));

  return (
    <form action={action} className="space-y-3">
      <p className="text-xs text-neutral-500">
        Enter the ZIP codes you serve (separated by spaces, commas, or new lines). Customers only
        see you when their address ZIP is in this list.
      </p>
      <textarea
        name="zips"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="95814 95816 95818"
        className="w-full rounded-md border border-neutral-200 px-3 py-2 font-mono text-sm"
      />
      {preview.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {preview.map((z) => (
            <span
              key={z}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
            >
              {z}
            </span>
          ))}
          <span className="px-1 text-xs text-neutral-400">
            {preview.length} ZIP{preview.length === 1 ? '' : 's'}
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save service area'}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved ✓</span>}
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
