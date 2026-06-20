import { getReviewsForCleaner } from '@/features/reviews/queries';

type Props = { cleanerId: string };

export const ReviewList = async ({ cleanerId }: Props) => {
  const reviews = await getReviewsForCleaner(cleanerId);
  if (reviews.length === 0) {
    return <p className="text-sm text-zinc-500">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((r) => (
        <li key={r.id} className="border-b pb-3 last:border-0 last:pb-0">
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="text-amber-500">{'★'.repeat(r.stars)}</span>
            <span className="text-zinc-400">{'☆'.repeat(5 - r.stars)}</span>
            <span className="text-zinc-500">· {r.customer_first_name}</span>
            <span className="text-xs text-zinc-400">
              {new Date(r.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          {r.body && <p className="whitespace-pre-wrap text-sm text-zinc-700">{r.body}</p>}
        </li>
      ))}
    </ul>
  );
};
