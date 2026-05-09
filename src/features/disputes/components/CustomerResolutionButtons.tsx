'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import {
  customerAcceptResolutionAction,
  customerRejectResolutionAction,
  type DisputeActionState,
} from '@/features/disputes/actions';
import { TrustCallout } from '@/components/ui/trust-callout';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { disputeId: string };

export const CustomerResolutionButtons = ({ disputeId }: Props) => {
  const router = useRouter();

  const acceptWithId = customerAcceptResolutionAction.bind(null, disputeId);
  const rejectWithId = customerRejectResolutionAction.bind(null, disputeId);

  const [acceptState, acceptAction, isAccepting] = useActionState(acceptWithId, INITIAL);
  const [rejectState, rejectAction, isRejecting] = useActionState(rejectWithId, INITIAL);

  useEffect(() => {
    if (acceptState.ok || rejectState.ok) router.refresh();
  }, [acceptState.ok, rejectState.ok, router]);

  const error = acceptState.error ?? rejectState.error;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <form action={acceptAction}>
          <button
            type="submit"
            disabled={isAccepting || isRejecting}
            className="inline-flex items-center justify-center rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all duration-control hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {isAccepting ? 'Accepting…' : 'Accept resolution'}
          </button>
        </form>
        <form action={rejectAction}>
          <button
            type="submit"
            disabled={isAccepting || isRejecting}
            className="inline-flex items-center justify-center rounded-xl border border-brand-600 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 shadow-tier1 transition-all duration-control hover:bg-neutral-50 hover:shadow-tier2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {isRejecting ? 'Escalating…' : 'Escalate to admin'}
          </button>
        </form>
      </div>
      {error && <TrustCallout variant="caution">{error}</TrustCallout>}
    </div>
  );
};
