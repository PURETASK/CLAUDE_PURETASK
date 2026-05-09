'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';

import { adminDecisionAction, type CleanerActionState } from '@/features/cleaner/actions';
import { TrustCallout } from '@/components/ui/trust-callout';

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
      <p className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-500">
        This application is {currentState}. No further action needed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-medium text-neutral-900">Admin decision</h2>

      {state.ok && state.message ? (
        <TrustCallout variant="success">{state.message}</TrustCallout>
      ) : null}
      {state.error ? <TrustCallout variant="caution">{state.error}</TrustCallout> : null}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">
            Reason / info request message (shown to applicant)
          </span>
          <textarea id="decision-reason" rows={3} className="pt-field text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-500">
            Internal admin notes (not shown to applicant)
          </span>
          <textarea id="admin-notes" rows={2} className="pt-field text-sm" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {canStartReview ? (
          <button
            type="button"
            onClick={() => submit('start_review')}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition-all duration-control hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && activeDecision === 'start_review' ? 'Saving…' : 'Start review'}
          </button>
        ) : null}
        {canDecide ? (
          <>
            <button
              type="button"
              onClick={() => submit('approve')}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all duration-control hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && activeDecision === 'approve' ? 'Saving…' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => submit('request_info')}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl border border-warning/30 px-4 py-2 text-sm font-semibold text-warning-dark transition-all duration-control hover:bg-warning-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && activeDecision === 'request_info' ? 'Saving…' : 'Request info'}
            </button>
            <button
              type="button"
              onClick={() => submit('reject')}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl border border-error/30 px-4 py-2 text-sm font-semibold text-error transition-all duration-control hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && activeDecision === 'reject' ? 'Saving…' : 'Reject'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};
