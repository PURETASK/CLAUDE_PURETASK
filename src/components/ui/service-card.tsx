import { type ReactNode } from 'react';

export interface ServiceCardProps {
  selected?: boolean;
  icon?: ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const ServiceCard = ({
  selected = false,
  icon,
  title,
  description,
  badge,
  onClick,
  className = '',
}: ServiceCardProps) => {
  const base =
    'relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-white p-5 text-left transition-all duration-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

  const state = selected
    ? 'border-brand-600 bg-brand-600/5 ring-2 ring-brand-600/20 shadow-tier2'
    : 'border-neutral-200 shadow-tier1 hover:border-neutral-300 hover:shadow-tier2';

  return (
    <button type="button" onClick={onClick} className={`${base} ${state} ${className}`}>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      {icon && <div className="text-brand-600">{icon}</div>}
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      {selected && (
        <div className="absolute bottom-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
};
