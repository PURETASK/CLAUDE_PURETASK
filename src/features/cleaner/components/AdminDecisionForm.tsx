'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';

import { adminDecisionAction, type CleanerActionState } from '@/features/cleaner/actions';

const INITIAL: CleanerActionState = { ok: false, error: null };

type Props = {
  applicationId: string;
  currentState: string;
};

export const AdminDecisionForm = ({ applicationId, currentState }: Props) => {
  const [state, formAction] = useActionState(adminDecisionAction, INITIAL);
  const [isPending, startTransition] = useTransition();
  const [activeDecision, setActiveDecision] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) setActiveDecision(null);
  }, [state.ok]);

  const submit = (decision: string) => {
    const fd = new FormData();
    fd.set('application_id', applicationId);
    fd.set('decision', decision);
    const reasonEl = document.getElementById('decision-reason') as HTMLTextAreaElement | null;
    const notesEl = document.getElementById('admin-notes') as HTMLTextAreaElement | null;
    if (reasonEl) fd.set('reason', reasonEl.value);
    if (notesEl) fd.set('admin_notes', notesEl.value);
    setActiveDecision(decision);
    startTransition(() => formAction(fd));
  };

  const canStartReview = currentState === 'submitted';
  const canDecide = ['submitted', 'in_review', 'needs_info'].includes(currentState);
  const isTerminal = ['approved', 'rejected'].includes(currentState);

  if (isTerminal) {
    return (
      <p className="rounded bg-zinc-100 p-3 text-sm text-zinc-500">
        This application is {currentState}. No further action needed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-medium">Admin decision</h2>

      {state.ok && state.message ? (
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-500">
            Reason / info request message (shown to applicant)
          </span>
          <textarea id="decision-reason" rows={3} className="rounded border px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-500">
            Internal admin notes (not shown to applicant)
          </span>
          <textarea id="admin-notes" rows={2} className="rounded border px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {canStartReview ? (
          <button
            type="button"
            onClick={() => submit('start_review')}
            disabled={isPending}
            className="rounded border px-4 py-2 text-sm disabled:opacity-60"
          >
            {isPending && activeDecision === 'start_review' ? 'Saving...' : 'Start review'}
          </button>
        ) : null}
        {canDecide ? (
          <>
            <button
              type="button"
              onClick={() => submit('approve')}
              disabled={isPending}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {isPending && activeDecision === 'approve' ? 'Saving...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => submit('request_info')}
              disabled={isPending}
              className="rounded border border-orange-300 px-4 py-2 text-sm text-orange-700 disabled:opacity-60"
            >
              {isPending && activeDecision === 'request_info' ? 'Saving...' : 'Request info'}
            </button>
            <button
              type="button"
              onClick={() => submit('reject')}
              disabled={isPending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-60"
            >
              {isPending && activeDecision === 'reject' ? 'Saving...' : 'Reject'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
