'use client';

import { LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOutAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils/cn';

import { isActiveHref, type NavItem, type RoleNav } from './nav-config';

type Props = {
  open: boolean;
  onClose: () => void;
  nav: RoleNav;
};

/** Slide-over with the full nav (primary + secondary) for mobile overflow. */
export const MobileNavDrawer = ({ open, onClose, nav }: Props) => {
  const pathname = usePathname();
  const items: NavItem[] = [...nav.primary, ...nav.secondary];

  return (
    <div
      className={cn('fixed inset-0 z-50 md:hidden', !open && 'pointer-events-none')}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          'absolute inset-0 h-full w-full cursor-default bg-navy-950/40 transition-opacity duration-control',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute inset-y-0 right-0 flex w-72 max-w-[80%] flex-col bg-white shadow-tier3 transition-transform duration-card ease-soft-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <span className="text-base font-bold tracking-tight text-brand-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {items.map((item) => {
            const active = isActiveHref(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form action={signOutAction} className="border-t border-neutral-100 p-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.8} />
            Sign out
          </button>
        </form>
      </aside>
    </div>
  );
};
