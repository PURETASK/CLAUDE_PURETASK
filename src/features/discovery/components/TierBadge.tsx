import { TIER_COLORS, TIER_LABELS } from '@/features/discovery/match-score';
import type { DiscoveryTier } from '@/features/discovery/match-score';

type Props = { tier: DiscoveryTier; size?: 'sm' | 'md' };

export const TierBadge = ({ tier, size = 'sm' }: Props) => {
  const { bg, text } = TIER_COLORS[tier];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`${bg} ${text} ${textSize} rounded-full px-2.5 py-0.5 font-medium`}>
      {TIER_LABELS[tier]}
    </span>
  );
};
