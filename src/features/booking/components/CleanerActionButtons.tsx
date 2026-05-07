'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import {
  acceptBookingAction,
  declineBookingAction,
  type BookingActionState,
} from '@/features/booking/actions';

const INITIAL: BookingActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const CleanerActionButtons = ({ bookingId }: Props) => {
  const router = useRouter();

  const acceptWithId = acceptBookingAction.bind(null, bookingId);
  const declineWithId = declineBookingAction.bind(null, bookingId);

  const [acceptState, acceptAction, isAccepting] = useActionState(acceptWithId, INITIAL);
  const [declineState, declineAction, isDeclining] = useActionState(declineWithId, INITIAL);

  useEffect(() => {
    if (acceptState.ok || declineState.ok) router.refresh();
  }, [acceptState.ok, declineState.ok, router]);

  const error = acceptState.error ?? declineState.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <form action={acceptAction}>
          <button
            type="submit"
            disabled={isAccepting || isDeclining}
            className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isAccepting ? 'Accepting…' : 'Accept'}
          </button>
        </form>
        <form action={declineAction}>
          <button
            type="submit"
            disabled={isAccepting || isDeclining}
            className="rounded border px-5 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
          >
            {isDeclining ? 'Declining…' : 'Decline'}
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
