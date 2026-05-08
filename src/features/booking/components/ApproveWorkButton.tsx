'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { approveBookingAction, type DisputeActionState } from '@/features/disputes/actions';

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
          className="rounded bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isPending ? 'Approving…' : 'Approve work'}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
};
