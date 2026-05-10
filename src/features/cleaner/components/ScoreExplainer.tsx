import Link from 'next/link';

const TIER_LABELS: Record<string, string> = {
  rising_pro: 'Rising Pro',
  proven_specialist: 'Proven Specialist',
  top_performer: 'Top Performer',
  all_star_expert: 'All-Star Expert',
};

const METRICS = [
  { key: 'on_time', label: 'On-time arrivals', weight: 25, examplePct: 94 },
  { key: 'completion', label: 'Job completion', weight: 25, examplePct: 100 },
  { key: 'photos', label: 'Photo compliance', weight: 15, examplePct: 80 },
  { key: 'ratings', label: 'Customer ratings', weight: 15, examplePct: 92 },
  { key: 'comms', label: 'Communication', weight: 10, examplePct: 95 },
  { key: 'reschedule', label: 'Reschedule rate', weight: 10, examplePct: 95 },
] as const;

interface Props {
  currentScore: number;
  currentTier: string;
}

export const ScoreExplainer = ({ currentScore, currentTier }: Props) => {
  const tierLabel = TIER_LABELS[currentTier] ?? currentTier;
  const worstMetric = [...METRICS].sort((a, b) => a.examplePct - b.examplePct)[0]!;

  const scoreDeg = Math.round((currentScore / 100) * 360);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier1">
        <div
          className="relative flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#7c3aed ${scoreDeg}deg, #e5e7eb ${scoreDeg}deg)`,
          }}
        >
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-bold text-neutral-900">{currentScore}</span>
            <span className="text-xs text-neutral-500">/ 100</span>
          </div>
        </div>
        <p className="mt-4 font-semibold text-neutral-900">{tierLabel}</p>
        <Link href="/cleaner/score/tiers" className="mt-1 text-sm text-brand-600 hover:underline">
          View all tiers →
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-4">
        <h3 className="font-semibold text-neutral-900">Score breakdown</h3>
        {METRICS.map((metric) => (
          <div key={metric.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-neutral-700">{metric.label}</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <span className="font-medium text-neutral-900">{metric.examplePct}%</span>
                <span className="text-xs">({metric.weight}% weight)</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${metric.examplePct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-warning-dark">
          Biggest improvement opportunity
        </p>
        <p className="mt-2 font-medium text-neutral-900">{worstMetric.label}</p>
        <p className="mt-1 text-sm text-neutral-600">
          {worstMetric.key === 'photos'
            ? 'Upload photos for every room after each job to improve your compliance score.'
            : worstMetric.key === 'on_time'
            ? 'Arriving within 5 minutes of your scheduled time counts as on-time.'
            : `Improving your ${worstMetric.label.toLowerCase()} will have the biggest impact on your overall score.`}
        </p>
      </div>
    </div>
  );
};
