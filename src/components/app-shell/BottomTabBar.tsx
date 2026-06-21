'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';

import { isActiveHref, type NavItem } from './nav-config';

export const BottomTabBar = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const active = isActiveHref(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-brand-600' : 'text-neutral-400 hover:text-neutral-600',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* iOS home-indicator safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
};
