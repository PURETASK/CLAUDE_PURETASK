const TIERS = [
  {
    key: 'rising_pro',
    label: 'Rising Pro',
    icon: '↑',
    minScore: 60,
    feePercent: 15,
    feeNote: '12% first 6 months',
    minHours: 4,
  },
  {
    key: 'proven_specialist',
    label: 'Proven Specialist',
    icon: '★',
    minScore: 70,
    feePercent: 13,
    feeNote: null,
    minHours: 4,
  },
  {
    key: 'top_performer',
    label: 'Top Performer',
    icon: '★★',
    minScore: 82,
    feePercent: 11,
    feeNote: null,
    minHours: 2,
  },
  {
    key: 'all_star_expert',
    label: 'All-Star Expert',
    icon: '★★★',
    minScore: 92,
    feePercent: 10,
    feeNote: null,
    minHours: 2,
  },
] as const;

interface Props {
  currentTier: string;
  currentScore: number;
}

export const TierExplainer = ({ currentTier, currentScore }: Props) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-600/20 bg-brand-600/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Your current tier
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-2xl">{TIERS.find((t) => t.key === currentTier)?.icon ?? '↑'}</span>
          <div>
            <p className="font-semibold text-neutral-900">
              {TIERS.find((t) => t.key === currentTier)?.label ?? currentTier}
            </p>
            <p className="text-sm text-neutral-500">
              Score: {currentScore} · Stay above{' '}
              {TIERS.find((t) => t.key === currentTier)?.minScore ?? 60} to maintain
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-4">
        <h3 className="font-semibold text-neutral-900">All tiers</h3>
        {TIERS.map((tier) => {
          const isCurrent = tier.key === currentTier;
          return (
            <div
              key={tier.key}
              className={`rounded-xl border p-4 ${
                isCurrent ? 'border-brand-600/30 bg-brand-600/5' : 'border-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tier.icon}</span>
                  <span
                    className={`font-medium ${isCurrent ? 'text-brand-600' : 'text-neutral-900'}`}
                  >
                    {tier.label}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      You
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-neutral-700">
                  Score ≥ {tier.minScore}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                <span>
                  Platform fee:{' '}
                  <span className="font-medium text-neutral-900">{tier.feePercent}%</span>
                  {tier.feeNote && (
                    <span className="ml-1 text-xs text-neutral-400">({tier.feeNote})</span>
                  )}
                </span>
                <span>
                  Minimum job:{' '}
                  <span className="font-medium text-neutral-900">{tier.minHours}h</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-2">
        <h3 className="font-semibold text-neutral-900">Tier change rules</h3>
        <ul className="space-y-1.5 text-sm text-neutral-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-600">•</span>
            Must stay in new score band for <strong>14 days</strong> before tier changes
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-brand-600">•</span>
            Veterans (6+ months at 75+) get a <strong>30-day cushion</strong>
          </li>
        </ul>
      </div>
    </div>
  );
};
