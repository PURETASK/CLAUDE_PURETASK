import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Show a chevron when the row is navigable. Defaults to true. */
  chevron?: boolean;
  className?: string;
}

/** A single tappable row — icon/avatar, title + subtitle, optional trailing value + chevron. */
export const ListRow = ({
  title,
  subtitle,
  leading,
  trailing,
  href,
  onClick,
  chevron = true,
  className = '',
}: ListRowProps) => {
  const navigable = Boolean(href || onClick);

  const content = (
    <>
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-900">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-neutral-500">{subtitle}</div>}
      </div>
      {trailing && <div className="flex-shrink-0 text-sm text-neutral-500">{trailing}</div>}
      {chevron && navigable && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-300" strokeWidth={2} />
      )}
    </>
  );

  const base = cn(
    'flex items-center gap-3 px-4 py-3',
    navigable && 'transition-colors hover:bg-neutral-50',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, 'w-full text-left')}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
};
