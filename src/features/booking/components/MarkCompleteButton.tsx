'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { markJobCompleteAction, type DisputeActionState } from '@/features/disputes/actions';
import { Button } from '@/components/ui/button';

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
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting…' : 'Mark job complete'}
        </Button>
      </form>
      {state.error && <p className="mt-2 text-xs text-error">{state.error}</p>}
    </div>
  );
};
