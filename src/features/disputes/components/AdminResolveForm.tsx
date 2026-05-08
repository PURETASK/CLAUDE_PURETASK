'use client';

import { useActionState } from 'react';

import { adminResolveDisputeAction, type DisputeActionState } from '@/features/disputes/actions';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { disputeId: string };

export const AdminResolveForm = ({ disputeId }: Props) => {
  const [state, formAction, isPending] = useActionState(adminResolveDisputeAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dispute_id" value={disputeId} />

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Resolution</label>
        <select
          name="resolution_type"
          required
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Select resolution</option>
          <option value="admin_no_refund">No refund — side with cleaner</option>
          <option value="admin_partial_refund">Partial refund</option>
          <option value="admin_refund">Full refund — side with customer</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Refund amount (cents, if applicable)
        </label>
        <input
          type="number"
          name="resolution_amount_cents"
          min="0"
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Leave blank for no refund"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Decision notes</label>
        <textarea
          name="resolution_notes"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Document your reasoning. This is visible to both parties."
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? 'Resolving…' : 'Resolve dispute'}
      </button>
    </form>
  );
};
