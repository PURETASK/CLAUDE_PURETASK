'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cancelBookingAction } from '@/features/booking/actions';
import { BubbleModal } from '@/features/experience/components/BubbleModal';

type Props = { params: Promise<{ id: string }> };

export default function CancelBookingPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBookingAction(id);
      if (result.ok) {
        setShowConfirm(false);
        router.push(`/app/bookings/${id}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-lg py-10">
      <Link
        href={`/app/bookings/${id}`}
        className="mb-6 block text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to booking
      </Link>

      <div className="rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-tier1">
        <h1 className="text-xl font-bold text-neutral-900">Cancel this booking?</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This action cannot be undone. Review the cancellation policy before confirming.
        </p>

        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Cancellation policy</h2>
          <div className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">More than 48 hours before</span>
              <span className="font-semibold text-green-700">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">24–48 hours before</span>
              <span className="font-semibold text-amber-600">50% fee</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Less than 24 hours</span>
              <span className="font-semibold text-red-600">100% fee</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/app/bookings/${id}`}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
          >
            Keep booking
          </Link>
          <Button
            className="flex-1 bg-red-600 text-white hover:brightness-110"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            Cancel booking
          </Button>
        </div>
      </div>

      <BubbleModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm cancellation"
        description="Your booking will be cancelled and fees may apply per the policy above."
        variant="alert"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>
              Go back
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:brightness-110"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? 'Cancelling…' : 'Yes, cancel'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          You will not be able to undo this. If you only need a different time, consider
          rescheduling instead.
        </p>
      </BubbleModal>
    </div>
  );
}
