'use client';

import { useActionState } from 'react';

import { adminResolveDisputeAction, type DisputeActionState } from '@/features/disputes/actions';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

const INITIAL: DisputeActionState = { ok: false, error: null };

const labelClass = 'mb-1 block text-sm font-medium text-neutral-700';
const fieldClass = 'pt-field';

type Props = { disputeId: string };

export const AdminResolveForm = ({ disputeId }: Props) => {
  const [state, formAction, isPending] = useActionState(adminResolveDisputeAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="dispute_id" value={disputeId} />

      <div>
        <label className={labelClass}>Resolution</label>
        <select name="resolution_type" required className={fieldClass}>
          <option value="">Select resolution</option>
          <option value="admin_no_refund">No refund — side with cleaner</option>
          <option value="admin_partial_refund">Partial refund</option>
          <option value="admin_refund">Full refund — side with customer</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Refund amount (cents, if applicable)</label>
        <input
          type="number"
          name="resolution_amount_cents"
          min="0"
          className={fieldClass}
          placeholder="Leave blank for no refund"
        />
      </div>

      <div>
        <label className={labelClass}>Decision notes</label>
        <textarea
          name="resolution_notes"
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          className={fieldClass}
          placeholder="Document your reasoning. This is visible to both parties."
        />
      </div>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Resolving…' : 'Resolve dispute'}
      </Button>
    </form>
  );
};
