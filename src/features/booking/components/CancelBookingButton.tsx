'use client';

import { useActionState } from 'react';

import { cancelBookingAction, type BookingActionState } from '@/features/booking/actions';

const INITIAL: BookingActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const CancelBookingButton = ({ bookingId }: Props) => {
  const cancelWithId = cancelBookingAction.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(cancelWithId, INITIAL);

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {isPending ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
};
