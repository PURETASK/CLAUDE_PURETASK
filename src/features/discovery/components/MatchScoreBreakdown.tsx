import type { MatchScoreBreakdown as Breakdown } from '@/features/discovery/scoring';
import { TIER_LABELS } from '@/features/discovery/scoring';
import type { MatchScoreInput } from '@/features/discovery/scoring';

type Props = {
  breakdown: Breakdown;
  tier: MatchScoreInput['current_tier'];
  hasZipFilter: boolean;
};

const Row = ({
  label,
  pts,
  max,
  detail,
}: {
  label: string;
  pts: number;
  max: number;
  detail: string;
}) => (
  <div className="flex items-center gap-3 py-2 text-sm">
    <div className="flex w-28 shrink-0 flex-col">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-zinc-400">{detail}</span>
    </div>
    <div className="h-1.5 flex-1 rounded-full bg-zinc-100">
      <div
        className="h-1.5 rounded-full bg-black transition-all"
        style={{ width: `${max > 0 ? (pts / max) * 100 : 0}%` }}
      />
    </div>
    <span className="w-12 shrink-0 text-right text-zinc-500">
      {pts}/{max}
    </span>
  </div>
);

export const MatchScoreBreakdown = ({ breakdown, tier, hasZipFilter }: Props) => (
  <div className="rounded border bg-white p-5">
    <div className="mb-1 flex items-baseline gap-2">
      <span className="text-2xl font-bold">{breakdown.total}</span>
      <span className="text-sm text-zinc-400">/ 100 match score</span>
    </div>
    <p className="mb-4 text-xs text-zinc-500">Why you&apos;re seeing this cleaner ranked here</p>
    <div className="divide-y">
      <Row label="Tier" pts={breakdown.tier} max={25} detail={TIER_LABELS[tier]} />
      <Row
        label="Rating"
        pts={breakdown.rating}
        max={25}
        detail={
          breakdown.rating === 0
            ? 'No reviews yet'
            : `${((breakdown.rating / 25) * 5).toFixed(1)} ★`
        }
      />
      <Row
        label="Reliability"
        pts={breakdown.reliability}
        max={20}
        detail={`${Math.round((breakdown.reliability / 20) * 100)} / 100 score`}
      />
      <Row
        label="ZIP coverage"
        pts={breakdown.zipCoverage}
        max={15}
        detail={
          !hasZipFilter
            ? 'Full points (no ZIP filter)'
            : breakdown.zipCoverage === 15
              ? 'Serves your area'
              : 'Outside your area'
        }
      />
      <Row
        label="Experience"
        pts={breakdown.experience}
        max={10}
        detail={`${Math.min(Math.round((breakdown.experience / 10) * 20), 20)}+ bookings`}
      />
      <Row
        label="Veteran"
        pts={breakdown.veteran}
        max={5}
        detail={breakdown.veteran === 5 ? '6+ months, score 75+' : 'Not yet earned'}
      />
    </div>
  </div>
);
