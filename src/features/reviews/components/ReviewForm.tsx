'use client';

import { useActionState, useState } from 'react';

import { submitReviewAction, type ReviewActionState } from '@/features/reviews/actions';
import type { TraitRow } from '@/features/reviews/queries';

const INITIAL: ReviewActionState = { ok: false, error: null };

type Props = { bookingId: string; traits: TraitRow[] };

export const ReviewForm = ({ bookingId, traits }: Props) => {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(submitReviewAction, INITIAL);

  const toggleTrait = (id: string) =>
    setSelectedTraits((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="stars" value={stars} />

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">How many stars?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-2xl leading-none focus:outline-none"
            >
              {n <= (hoveredStar || stars) ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {traits.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700">What stood out? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {traits.map((t) => {
              const selected = selectedTraits.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrait(t.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {t.display_label}
                </button>
              );
            })}
          </div>
          {selectedTraits.map((id) => (
            <input key={id} type="hidden" name="trait_ids" value={id} />
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Tell others about your experience (optional)
        </label>
        <textarea
          name="body"
          rows={3}
          maxLength={1000}
          className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="What did you love? What could be better?"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || stars === 0}
        className="rounded bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
};
