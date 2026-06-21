'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';

type Counts = { applications: number; disputes: number };

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
  badge?: keyof Counts;
  danger?: boolean;
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', exact: true },
  { label: 'Applications', href: '/admin/applications', badge: 'applications' },
  { label: 'Bookings', href: '/admin/bookings' },
  { label: 'Disputes', href: '/admin/disputes', badge: 'disputes', danger: true },
  { label: 'Support', href: '/admin/support' },
];

const useActive = () => {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
};

const Badge = ({ value, danger }: { value: number; danger?: boolean }) =>
  value > 0 ? (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
        danger ? 'bg-error text-white' : 'bg-neutral-900 text-white',
      )}
    >
      {value}
    </span>
  ) : null;

/** Desktop left rail. */
export function AdminSidebar({ counts }: { counts: Counts }) {
  const isActive = useActive();
  return (
    <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white px-3 py-4 md:flex">
      <Link
        href="/admin"
        className="px-3 pb-4 text-sm font-bold uppercase tracking-wide text-brand-900"
      >
        PureTask · Admin
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-neutral-100 font-semibold text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
              )}
            >
              {item.label}
              {item.badge && <Badge value={counts[item.badge]} danger={item.danger} />}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/app"
        className="mt-auto px-3 py-2 text-xs text-neutral-400 transition-colors hover:text-brand-600"
      >
        ← Back to app
      </Link>
    </aside>
  );
}

/** Mobile horizontal nav (admin is desktop-first; this keeps it usable on phones). */
export function AdminMobileNav({ counts }: { counts: Counts }) {
  const isActive = useActive();
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:hidden">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors',
              active
                ? 'bg-neutral-100 font-semibold text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900',
            )}
          >
            {item.label}
            {item.badge && <Badge value={counts[item.badge]} danger={item.danger} />}
          </Link>
        );
      })}
    </div>
  );
}
