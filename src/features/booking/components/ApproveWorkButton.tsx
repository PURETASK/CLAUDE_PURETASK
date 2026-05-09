'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { approveBookingAction, type DisputeActionState } from '@/features/disputes/actions';
import { Button } from '@/components/ui/button';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const ApproveWorkButton = ({ bookingId }: Props) => {
  const router = useRouter();
  const action = approveBookingAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(action, INITIAL);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-success px-5 py-2 text-sm font-semibold text-white shadow-tier1 transition-all duration-control hover:brightness-110 hover:shadow-tier2 disabled:opacity-50"
        >
          {isPending ? 'Approving…' : 'Approve work'}
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs text-error">{state.error}</p>}
    </div>
  );
};
