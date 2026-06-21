import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

export interface StepperProps {
  steps: string[];
  /** Zero-based index of the active step. Earlier steps render as completed. */
  current: number;
  className?: string;
}

/** Horizontal progress for multi-step flows (booking, cleaner application). */
export const Stepper = ({ steps, current, className = '' }: StepperProps) => (
  <div className={cn('flex items-start', className)}>
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      const isLast = i === steps.length - 1;
      return (
        <div key={label} className={cn('flex items-start', !isLast && 'flex-1')}>
          <div className="flex w-16 flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done
                  ? 'bg-brand-600 text-white'
                  : active
                    ? 'border-2 border-brand-600 text-brand-600'
                    : 'border border-neutral-300 text-neutral-400',
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={cn(
                'text-center text-[11px] font-medium leading-tight',
                active || done ? 'text-neutral-900' : 'text-neutral-400',
              )}
            >
              {label}
            </span>
          </div>
          {!isLast && (
            <div
              className={cn(
                'mt-3.5 h-0.5 flex-1 rounded',
                i < current ? 'bg-brand-600' : 'bg-neutral-200',
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);
