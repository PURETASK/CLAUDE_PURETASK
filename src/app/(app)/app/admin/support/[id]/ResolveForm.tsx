'use client';

import { useActionState } from 'react';

import { resolveTicketAction } from '@/features/support/actions';

type Props = { ticketId: string };

export function ResolveForm({ ticketId }: Props) {
  const [state, action, pending] = useActionState(resolveTicketAction, { ok: false, error: null });

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <div>
        <label
          htmlFor="resolution_notes"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Resolution notes <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="resolution_notes"
          name="resolution_notes"
          rows={3}
          maxLength={2000}
          placeholder="Describe how this was resolved…"
          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? 'Resolving…' : 'Mark as resolved'}
      </button>
    </form>
  );
}
