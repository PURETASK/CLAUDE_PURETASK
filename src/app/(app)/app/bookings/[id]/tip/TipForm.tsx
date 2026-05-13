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
            className={`rounded-xl border py-2 text-sm font-semibold transition-colors duration-control ${
              selected === p.cents && !custom
                ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="mb-6">
        <label className="mb-1 block text-left text-xs text-neutral-500">Custom amount</label>
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
            className="w-full rounded-lg border border-neutral-200 py-2 pl-7 pr-3 text-sm focus:border-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {state.error && <p className="mb-3 text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !amountCents || amountCents < 100}
        className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:shadow-tier2 hover:brightness-110 disabled:opacity-40 disabled:hover:shadow-tier1"
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
