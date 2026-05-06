import { TIER_COLORS, TIER_LABELS } from '@/features/discovery/scoring';
import type { MatchScoreInput } from '@/features/discovery/scoring';

type Props = { tier: MatchScoreInput['current_tier']; size?: 'sm' | 'md' };

export const TierBadge = ({ tier, size = 'sm' }: Props) => {
  const { bg, text } = TIER_COLORS[tier];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`${bg} ${text} ${textSize} rounded-full px-2.5 py-0.5 font-medium`}>
      {TIER_LABELS[tier]}
    </span>
  );
};
