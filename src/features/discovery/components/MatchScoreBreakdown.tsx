import type { MatchTransparency } from '@/features/discovery/match-score';

type Props = {
  transparency: MatchTransparency;
  hasZipFilter: boolean;
};

const STRENGTH_WIDTH = { high: '100%', medium: '66%', low: '33%' };

const Row = ({ label, strength, detail }: { label: string; strength: string; detail: string }) => (
  <div className="flex items-center gap-3 py-2 text-sm">
    <div className="flex w-28 shrink-0 flex-col">
      <span className="font-medium text-neutral-800">{label}</span>
      <span className="text-xs text-neutral-400">{detail}</span>
    </div>
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
      <div
        className="h-1.5 rounded-full bg-gradient-brand transition-all duration-card"
        style={{ width: STRENGTH_WIDTH[strength as keyof typeof STRENGTH_WIDTH] ?? '33%' }}
      />
    </div>
    <span className="w-14 shrink-0 text-right capitalize text-neutral-500">{strength}</span>
  </div>
);

export const MatchScoreBreakdown = ({ transparency, hasZipFilter }: Props) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
    <div className="mb-1 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-brand-900">{transparency.displayScore}</span>
      <span className="text-sm text-neutral-400">/ 100 match score</span>
    </div>
    <p className="mb-4 text-xs text-neutral-500">Why you&apos;re seeing this cleaner ranked here</p>
    <div className="divide-y divide-neutral-100">
      {transparency.factors.map((factor) => (
        <Row
          key={factor.key}
          label={factor.label}
          strength={factor.strength}
          detail={
            factor.key === 'local_fit' && !hasZipFilter
              ? `${factor.blurb} (no ZIP filter applied)`
              : factor.blurb
          }
        />
      ))}
    </div>
  </div>
);
