'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { adminReplyAction } from '@/features/support/actions';

type Props = { ticketId: string };

export function AdminReplyForm({ ticketId }: Props) {
  const [state, action, pending] = useActionState(adminReplyAction, { ok: false, error: null });
  const [isInternal, setIsInternal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <input type="hidden" name="is_internal" value={String(isInternal)} />

      <textarea
        name="body"
        required
        rows={5}
        maxLength={5000}
        placeholder={isInternal ? 'Internal note (not visible to customer)…' : 'Reply to customer…'}
        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
          isInternal ? 'border-amber-200 bg-amber-50' : 'border-neutral-200'
        }`}
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded"
          />
          Internal note
        </label>
        <div className="flex items-center gap-2">
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-emerald-600">Sent.</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {pending ? 'Sending…' : isInternal ? 'Add note' : 'Send reply'}
          </button>
        </div>
      </div>
    </form>
  );
}
