import { Star } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export interface StarsProps {
  /** Rating from 0 to 5. */
  rating: number;
  /** Optional review count rendered as "(123)". */
  count?: number;
  size?: 'sm' | 'md';
  /** Hide the numeric value next to the stars. */
  hideValue?: boolean;
  className?: string;
}

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4' } as const;

export const Stars = ({
  rating,
  count,
  size = 'md',
  hideValue = false,
  className = '',
}: StarsProps) => {
  const filled = Math.round(rating);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="inline-flex" aria-label={`${rating.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              SIZES[size],
              i < filled ? 'fill-warning text-warning' : 'fill-neutral-200 text-neutral-200',
            )}
            strokeWidth={0}
          />
        ))}
      </span>
      {!hideValue && (
        <span className="text-sm font-medium text-neutral-700">{rating.toFixed(1)}</span>
      )}
      {typeof count === 'number' && <span className="text-xs text-neutral-400">({count})</span>}
    </span>
  );
};
