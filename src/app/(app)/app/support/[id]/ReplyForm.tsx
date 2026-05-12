'use client';

import { useActionState, useEffect, useRef } from 'react';

import { replyToTicketAction } from '@/features/support/actions';

type Props = { ticketId: string };

export function ReplyForm({ ticketId }: Props) {
  const [state, action, pending] = useActionState(replyToTicketAction, { ok: false, error: null });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea
        name="body"
        required
        rows={4}
        maxLength={5000}
        placeholder="Write a reply…"
        className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Reply sent.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send reply'}
      </button>
    </form>
  );
}
