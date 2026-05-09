'use client';

import { useActionState, useState } from 'react';

import { cleanerRespondAction, type DisputeActionState } from '@/features/disputes/actions';
import { RESPONSE_TYPE_LABELS } from '@/features/disputes/validation';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

const INITIAL: DisputeActionState = { ok: false, error: null };

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700';
const fieldClass = 'pt-field';

type Props = { disputeId: string };

export const CleanerResponseForm = ({ disputeId }: Props) => {
  const [responseType, setResponseType] = useState('');
  const [state, formAction, isPending] = useActionState(cleanerRespondAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dispute_id" value={disputeId} />

      <div>
        <label className={labelClass}>Your response</label>
        <select
          name="response_type"
          required
          value={responseType}
          onChange={(e) => setResponseType(e.target.value)}
          className={fieldClass}
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
          <label className={labelClass}>Refund amount (dollars)</label>
          <input
            type="number"
            name="response_amount_cents"
            min="0"
            step="1"
            placeholder="e.g. 25"
            className={fieldClass}
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              input.value = String(Math.round(parseFloat(input.value || '0') * 100));
            }}
          />
          <p className="mt-1 text-xs text-neutral-400">Enter whole dollar amount</p>
        </div>
      )}

      <div>
        <label className={labelClass}>Message to customer</label>
        <textarea
          name="response_message"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          className={fieldClass}
          placeholder="Explain your response to the customer."
        />
      </div>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}
      {state.ok && <TrustCallout variant="success">Response submitted.</TrustCallout>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Submitting…' : 'Submit response'}
      </Button>
    </form>
  );
};
