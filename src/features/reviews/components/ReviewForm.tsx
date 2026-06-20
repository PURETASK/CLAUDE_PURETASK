'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { submitReviewAction, type ReviewActionState } from '@/features/reviews/actions';

const INITIAL: ReviewActionState = { ok: false, error: null };

type Props = { bookingId: string };

export const ReviewForm = ({ bookingId }: Props) => {
  const router = useRouter();
  const [stars, setStars] = useState<number>(5);
  const [state, formAction, isPending] = useActionState(submitReviewAction, INITIAL);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border bg-white p-5 text-sm">
      <p className="font-medium">Review your cleaner</p>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="stars" value={stars} />

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            disabled={isPending}
            className={`text-2xl transition-colors ${
              n <= stars ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-300'
            }`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-xs text-zinc-500">{stars}/5</span>
      </div>

      <textarea
        name="body"
        rows={4}
        maxLength={2000}
        placeholder="Optional: tell other customers about your experience."
        className="rounded border px-3 py-2 text-sm"
        disabled={isPending}
      />

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded bg-black px-5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? 'Submitting…' : 'Submit review'}
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
};
