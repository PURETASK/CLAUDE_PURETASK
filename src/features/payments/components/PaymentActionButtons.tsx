'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import {
  authorizeBookingPaymentAction,
  captureBookingPaymentAction,
  type PaymentActionState,
} from '@/features/payments/actions';

const INITIAL: PaymentActionState = { ok: false, error: null };

type Variant = 'authorize' | 'capture';

type Props = {
  bookingId: string;
  variant: Variant;
};

const LABEL: Record<Variant, { idle: string; pending: string; help: string }> = {
  authorize: {
    idle: 'Authorize payment',
    pending: 'Authorizing…',
    help: 'Places a hold on your card. You are only charged after the cleaning is approved.',
  },
  capture: {
    idle: 'Release payment to cleaner',
    pending: 'Capturing…',
    help: 'Releases the held funds to the cleaner. Required after work is approved.',
  },
};

export const PaymentActionButton = ({ bookingId, variant }: Props) => {
  const router = useRouter();
  const action =
    variant === 'authorize' ? authorizeBookingPaymentAction : captureBookingPaymentAction;
  const bound = action.bind(null, bookingId);
  const [state, formAction, isPending] = useActionState(bound, INITIAL);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const labels = LABEL[variant];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">{labels.help}</p>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isPending ? labels.pending : labels.idle}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
};
