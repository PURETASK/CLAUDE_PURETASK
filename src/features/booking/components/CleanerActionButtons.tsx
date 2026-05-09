'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import {
  acceptBookingAction,
  declineBookingAction,
  type BookingActionState,
} from '@/features/booking/actions';
import { Button } from '@/components/ui/button';

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
          <Button type="submit" disabled={isAccepting || isDeclining}>
            {isAccepting ? 'Accepting…' : 'Accept'}
          </Button>
        </form>
        <form action={declineAction}>
          <Button type="submit" variant="secondary" disabled={isAccepting || isDeclining}>
            {isDeclining ? 'Declining…' : 'Decline'}
          </Button>
        </form>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
};
