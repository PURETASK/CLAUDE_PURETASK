import { type ReactNode } from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'info';

const VARIANTS: Record<BadgeVariant, string> = {
  brand: 'bg-brand-900/10 text-brand-900',
  info: 'bg-brand-600/10 text-brand-600',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  error: 'bg-error-light text-error-dark',
  neutral: 'bg-neutral-100 text-neutral-600',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
  >
    {children}
  </span>
);
