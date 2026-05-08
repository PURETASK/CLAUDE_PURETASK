'use client';

import { useActionState, useState } from 'react';

import { addTipAction, type TipActionState } from '@/features/payments/actions';

const PRESETS = [
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$15', cents: 1500 },
  { label: '$20', cents: 2000 },
];

const initial: TipActionState = { ok: false, error: null };

export function TipForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(addTipAction, initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  const amountCents = custom ? Math.round(parseFloat(custom) * 100) : selected;

  return (
    <form action={action}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="amount_cents" value={amountCents ?? ''} />

      {/* Preset buttons */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.cents}
            type="button"
            onClick={() => {
              setSelected(p.cents);
              setCustom('');
            }}
            className={`rounded-xl border py-2 text-sm font-semibold transition-colors ${
              selected === p.cents && !custom
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="mb-6">
        <label className="mb-1 block text-left text-xs text-zinc-500">Custom amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
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
            className="w-full rounded-lg border border-zinc-200 py-2 pl-7 pr-3 text-sm focus:border-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {state.error && <p className="mb-3 text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !amountCents || amountCents < 100}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending
          ? 'Processing…'
          : amountCents && amountCents >= 100
            ? `Send $${(amountCents / 100).toFixed(0)} tip`
            : 'Select an amount'}
      </button>
    </form>
  );
}
