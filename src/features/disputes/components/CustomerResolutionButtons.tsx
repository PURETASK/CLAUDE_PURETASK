'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import {
  customerAcceptResolutionAction,
  customerRejectResolutionAction,
  type DisputeActionState,
} from '@/features/disputes/actions';

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
            className="rounded bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isAccepting ? 'Accepting…' : 'Accept resolution'}
          </button>
        </form>
        <form action={rejectAction}>
          <button
            type="submit"
            disabled={isAccepting || isRejecting}
            className="rounded border px-5 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
          >
            {isRejecting ? 'Escalating…' : 'Escalate to admin'}
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
