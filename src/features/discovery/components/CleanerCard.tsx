import Link from 'next/link';

import { TierBadge } from '@/features/discovery/components/TierBadge';
import type { MatchTransparency } from '@/features/discovery/match-score';
import type { CleanerBrowseRow } from '@/features/discovery/queries';

const SERVICE_LABELS: Record<string, string> = {
  standard: 'Standard',
  deep: 'Deep',
  move_out: 'Move-out',
  airbnb: 'Airbnb',
};

type Props = { cleaner: CleanerBrowseRow; score: MatchTransparency; distanceMiles: number | null };

export const CleanerCard = ({ cleaner, score, distanceMiles }: Props) => {
  const offeredServices = Object.entries(cleaner.hourly_rates_cents)
    .filter(([, rate]) => rate > 0)
    .map(([type]) => SERVICE_LABELS[type] ?? type);

  const lowestRate = Object.values(cleaner.hourly_rates_cents)
    .filter((r) => r > 0)
    .sort((a, b) => a - b)[0];

  return (
    <Link
      href={`/app/cleaners/${cleaner.id}`}
      className="flex flex-col gap-3 rounded border bg-white p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{cleaner.full_name}</span>
          <TierBadge tier={cleaner.current_tier} />
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-zinc-900">{score.displayScore}</div>
          <div className="text-xs text-zinc-400">/ 100 match</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
        {cleaner.average_rating != null ? (
          <span>
            {cleaner.average_rating.toFixed(1)} ★ ({cleaner.review_count})
          </span>
        ) : (
          <span>No reviews yet</span>
        )}
        {lowestRate != null && <span>From ${(lowestRate / 100).toFixed(0)}/hr</span>}
        {distanceMiles != null && <span>{distanceMiles.toFixed(1)} mi away</span>}
      </div>

      {offeredServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {offeredServices.map((s) => (
            <span key={s} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};
