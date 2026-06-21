import Link from 'next/link';
import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: ReactNode;
  /** Optional right-aligned "See all" style link. */
  action?: { label: string; href: string };
  className?: string;
}

export const SectionHeader = ({ title, action, className = '' }: SectionHeaderProps) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>
    <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
    {action && (
      <Link
        href={action.href}
        className="flex-shrink-0 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        {action.label}
      </Link>
    )}
  </div>
);
