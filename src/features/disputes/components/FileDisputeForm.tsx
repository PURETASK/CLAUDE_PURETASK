'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';
import { fileDisputeAction, type DisputeActionState } from '@/features/disputes/actions';
import { DESIRED_OUTCOME_LABELS, ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';
import { BubbleModal } from '@/features/experience/components/BubbleModal';

const INITIAL: DisputeActionState = { ok: false, error: null };

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700';
const fieldClass = 'pt-field';

type Props = { bookingId: string };

export const FileDisputeForm = ({ bookingId }: Props) => {
  const [state, formAction, isPending] = useActionState(fileDisputeAction, INITIAL);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingForm, setPendingForm] = useState<HTMLFormElement | null>(null);

  const requestSubmit = (form: HTMLFormElement) => {
    setPendingForm(form);
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    if (!pendingForm) return;
    setShowConfirm(false);
    const formData = new FormData(pendingForm);
    formAction(formData);
    setPendingForm(null);
  };

  return (
    <>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!e.currentTarget.reportValidity()) return;
          requestSubmit(e.currentTarget);
        }}
      >
        <input type="hidden" name="booking_id" value={bookingId} />

        <div>
          <label className={labelClass}>What is the issue?</label>
          <select name="issue_category" required className={fieldClass}>
            <option value="">Select a category</option>
            {Object.entries(ISSUE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>What outcome are you looking for?</label>
          <select name="customer_desired_outcome" required className={fieldClass}>
            <option value="">Select an outcome</option>
            {Object.entries(DESIRED_OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Describe the issue</label>
          <textarea
            name="customer_description"
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            className={fieldClass}
            placeholder="Please describe what happened in detail. Be as specific as possible."
          />
        </div>

        {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Filing dispute…' : 'File dispute'}
        </Button>
      </form>

      <BubbleModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="File this dispute?"
        description="Our team and your cleaner will be notified. Provide accurate details."
        variant="alert"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>
              Review again
            </Button>
            <Button className="flex-1" onClick={confirmSubmit} disabled={isPending}>
              {isPending ? 'Submitting…' : 'Submit dispute'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          Disputes are reviewed with photo evidence and job records when available. False or
          repeated claims may affect account standing.
        </p>
      </BubbleModal>
    </>
  );
};
