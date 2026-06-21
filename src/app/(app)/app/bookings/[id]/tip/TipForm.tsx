'use client';

import { useActionState, useState } from 'react';

import { addTipAction, type TipActionState } from '@/features/payments/actions';
import { cn } from '@/lib/utils/cn';

const PRESETS = [
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$15', cents: 1500 },
];

const initial: TipActionState = { ok: false, error: null };

export function TipForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(addTipAction, initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  const rawCents = custom ? Math.round(parseFloat(custom) * 100) : selected;
  const amountCents = rawCents && Number.isFinite(rawCents) ? rawCents : null;
  const valid = amountCents !== null && amountCents >= 100;
  const dollars = amountCents ? amountCents / 100 : 0;

  return (
    <form action={action} className="flex flex-col gap-4 text-left">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="amount_cents" value={amountCents ?? ''} />

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.cents}
            type="button"
            onClick={() => {
              setSelected(p.cents);
              setCustom('');
            }}
            className={cn(
              'rounded-xl border py-3 text-base font-semibold transition-colors',
              selected === p.cents && !custom
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs text-neutral-500">Custom amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            $
          </span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected(null);
            }}
            placeholder="0"
            className="w-full rounded-lg border border-neutral-200 py-2 pl-7 pr-3 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
      </div>

      {valid && (
        <div className="rounded-xl bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Tip amount</span>
            <span className="font-medium text-neutral-900">${dollars.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-500">Your cleaner receives</span>
            <span className="text-neutral-900">${dollars.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            100% goes to your cleaner — PureTask doesn&apos;t take a cut.
          </p>
        </div>
      )}

      {state.error && <p className="text-xs text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !valid}
        className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
      >
        {pending ? 'Processing…' : valid ? `Send $${dollars.toFixed(0)} tip` : 'Select an amount'}
      </button>
    </form>
  );
}
