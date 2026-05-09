'use client';

import { useActionState, useState } from 'react';

import { submitReviewAction, type ReviewActionState } from '@/features/reviews/actions';
import type { TraitRow } from '@/features/reviews/queries';
import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';

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
        <p className="mb-2 text-sm font-medium text-neutral-700">How many stars?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-2xl leading-none text-neutral-300 transition-colors duration-micro focus:outline-none"
              style={{ color: n <= (hoveredStar || stars) ? 'var(--color-accent-400)' : undefined }}
            >
              {n <= (hoveredStar || stars) ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {traits.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">What stood out? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {traits.map((t) => {
              const selected = selectedTraits.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrait(t.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors duration-control ${
                    selected
                      ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
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
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Tell others about your experience (optional)
        </label>
        <textarea
          name="body"
          rows={3}
          maxLength={1000}
          className="pt-field"
          placeholder="What did you love? What could be better?"
        />
      </div>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

      <Button type="submit" disabled={isPending || stars === 0}>
        {isPending ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
};
