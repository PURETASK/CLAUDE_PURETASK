import type { MatchTransparency } from '@/features/discovery/match-score';

type Props = {
  transparency: MatchTransparency;
  hasZipFilter: boolean;
};

const Row = ({ label, strength, detail }: { label: string; strength: string; detail: string }) => (
  <div className="flex items-center gap-3 py-2 text-sm">
    <div className="flex w-28 shrink-0 flex-col">
      <span className="font-medium">{label}</span>
      <span className="text-xs text-zinc-400">{detail}</span>
    </div>
    <div className="h-1.5 flex-1 rounded-full bg-zinc-100">
      <div
        className="h-1.5 rounded-full bg-black transition-all"
        style={{
          width: `${strength === 'high' ? 100 : strength === 'medium' ? 66 : 33}%`,
        }}
      />
    </div>
    <span className="w-14 shrink-0 text-right text-zinc-500 capitalize">{strength}</span>
  </div>
);

export const MatchScoreBreakdown = ({ transparency, hasZipFilter }: Props) => (
  <div className="rounded border bg-white p-5">
    <div className="mb-1 flex items-baseline gap-2">
      <span className="text-2xl font-bold">{transparency.displayScore}</span>
      <span className="text-sm text-zinc-400">/ 100 match score</span>
    </div>
    <p className="mb-4 text-xs text-zinc-500">Why you&apos;re seeing this cleaner ranked here</p>
    <div className="divide-y">
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
