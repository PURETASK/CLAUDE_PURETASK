'use client';

import { useActionState, useState } from 'react';

import { cleanerRespondAction, type DisputeActionState } from '@/features/disputes/actions';
import { RESPONSE_TYPE_LABELS } from '@/features/disputes/validation';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { disputeId: string };

export const CleanerResponseForm = ({ disputeId }: Props) => {
  const [responseType, setResponseType] = useState('');
  const [state, formAction, isPending] = useActionState(cleanerRespondAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dispute_id" value={disputeId} />

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Your response</label>
        <select
          name="response_type"
          required
          value={responseType}
          onChange={(e) => setResponseType(e.target.value)}
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Select your response</option>
          {Object.entries(RESPONSE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {responseType === 'offer_partial_refund' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Refund amount (dollars)
          </label>
          <input
            type="number"
            name="response_amount_cents"
            min="0"
            step="1"
            placeholder="e.g. 25"
            className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              input.value = String(Math.round(parseFloat(input.value || '0') * 100));
            }}
          />
          <p className="mt-1 text-xs text-zinc-400">Enter whole dollar amount</p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Message to customer</label>
        <textarea
          name="response_message"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Explain your response to the customer."
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Response submitted.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? 'Submitting…' : 'Submit response'}
      </button>
    </form>
  );
};
