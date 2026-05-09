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
          className="rounded-xl border border-error/30 px-4 py-2 text-sm font-medium text-error transition-all duration-control hover:bg-error-light disabled:opacity-50"
        >
          {isPending ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs text-error">{state.error}</p>}
    </div>
  );
};
