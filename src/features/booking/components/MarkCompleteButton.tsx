'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { markJobCompleteAction, type DisputeActionState } from '@/features/disputes/actions';

const INITIAL: DisputeActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const MarkCompleteButton = ({ bookingId }: Props) => {
  const router = useRouter();
  const action = markJobCompleteAction.bind(null, bookingId);
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
          className="rounded bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isPending ? 'Submitting…' : 'Mark job complete'}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
};
