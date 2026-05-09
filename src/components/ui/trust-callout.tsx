import { type ReactNode } from 'react';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'caution';

const STYLES: Record<
  CalloutVariant,
  { bg: string; border: string; heading: string; body: string }
> = {
  info: {
    bg: 'bg-brand-600/5',
    border: 'border-brand-600/20',
    heading: 'text-brand-900',
    body: 'text-brand-600',
  },
  success: {
    bg: 'bg-success-light',
    border: 'border-success/30',
    heading: 'text-success-dark',
    body: 'text-success',
  },
  warning: {
    bg: 'bg-warning-light',
    border: 'border-warning/30',
    heading: 'text-warning-dark',
    body: 'text-warning',
  },
  caution: {
    bg: 'bg-error-light',
    border: 'border-error/30',
    heading: 'text-error-dark',
    body: 'text-error',
  },
};

export interface TrustCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const TrustCallout = ({
  variant = 'info',
  title,
  icon,
  children,
  className = '',
}: TrustCalloutProps) => {
  const s = STYLES[variant];
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${s.bg} ${s.border} ${className}`}
    >
      {icon && <span className={`mt-0.5 shrink-0 ${s.body}`}>{icon}</span>}
      <div className="flex flex-col gap-0.5">
        {title && <p className={`text-sm font-medium ${s.heading}`}>{title}</p>}
        <div className={`text-sm ${s.heading}`}>{children}</div>
      </div>
    </div>
  );
};
