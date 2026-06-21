import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export interface MoneyRowProps {
  label: ReactNode;
  /** Pre-formatted amount string, e.g. "$120.00" or "-$15.00". */
  amount: ReactNode;
  /** Bold total row with a larger amount. */
  emphasis?: boolean;
  /** Muted secondary row (e.g. discounts, fees breakdown). */
  muted?: boolean;
  className?: string;
}

/** Label + right-aligned amount, for price breakdowns and earnings summaries. */
export const MoneyRow = ({ label, amount, emphasis, muted, className = '' }: MoneyRowProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 py-1.5 text-sm',
      emphasis ? 'font-semibold text-neutral-900' : muted ? 'text-neutral-500' : 'text-neutral-700',
      className,
    )}
  >
    <span>{label}</span>
    <span className={cn('tabular-nums', emphasis && 'text-base')}>{amount}</span>
  </div>
);
