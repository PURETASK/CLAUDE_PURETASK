'use client';

import { Star } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { TrustCallout } from '@/components/ui/trust-callout';
import { submitReviewAction, type ReviewActionState } from '@/features/reviews/actions';
import type { TraitRow } from '@/features/reviews/queries';
import { cn } from '@/lib/utils/cn';

const INITIAL: ReviewActionState = { ok: false, error: null };
const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

type Props = { bookingId: string; traits: TraitRow[] };

export const ReviewForm = ({ bookingId, traits }: Props) => {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(submitReviewAction, INITIAL);

  const toggleTrait = (id: string) =>
    setSelectedTraits((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const display = hovered || stars;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="stars" value={stars} />

      {/* Star rating */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'h-9 w-9',
                  n <= display ? 'fill-warning text-warning' : 'fill-neutral-200 text-neutral-200',
                )}
                strokeWidth={0}
              />
            </button>
          ))}
        </div>
        <p className={cn('text-sm font-medium', display ? 'text-neutral-900' : 'text-neutral-400')}>
          {display ? (RATING_LABELS[display - 1] ?? '') : 'Tap to rate'}
        </p>
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
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400',
                  )}
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
          Add a written review (optional)
        </label>
        <textarea
          name="body"
          rows={4}
          maxLength={1000}
          className="pt-field"
          placeholder="Help other customers know what to expect…"
        />
      </div>

      {state.error && <TrustCallout variant="caution">{state.error}</TrustCallout>}

      <Button type="submit" disabled={isPending || stars === 0}>
        {isPending ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
};
