import type { ReviewRow } from '@/features/reviews/queries';

type Props = { review: ReviewRow };

export const ReviewCard = ({ review }: Props) => {
  const stars = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);
  const date = new Date(review.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="border-b border-zinc-100 py-4 last:border-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-amber-500">{stars}</span>
        <span className="text-xs text-zinc-400">{date}</span>
      </div>
      {review.traits.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {review.traits.map((t) => (
            <span
              key={t.display_label}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
            >
              {t.display_label}
            </span>
          ))}
        </div>
      )}
      {review.body && <p className="text-sm text-zinc-700">{review.body}</p>}
      <p className="mt-1 text-xs text-zinc-400">{review.customer_name}</p>
    </div>
  );
};
