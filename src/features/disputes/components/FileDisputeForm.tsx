'use client';

import { useActionState } from 'react';

import { fileDisputeAction, type DisputeActionState } from '@/features/disputes/actions';
import { DESIRED_OUTCOME_LABELS, ISSUE_CATEGORY_LABELS } from '@/features/disputes/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

const INITIAL: DisputeActionState = { ok: false, error: null };

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700';
const fieldClass = 'pt-field';

type Props = { bookingId: string };

export const FileDisputeForm = ({ bookingId }: Props) => {
  const [state, formAction, isPending] = useActionState(fileDisputeAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
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
  );
};
