'use client';

import { LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOutAction } from '@/features/auth/actions';
import { BRAND } from '@/lib/assets';
import { cn } from '@/lib/utils/cn';

import { isActiveHref, type NavItem, type RoleNav } from './nav-config';

const SidebarLink = ({ item, active }: { item: NavItem; active: boolean }) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-control',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
};

export const AppSidebar = ({ nav, homeHref }: { nav: RoleNav; homeHref: string }) => {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white md:flex">
      <Link href={homeHref} className="flex items-center gap-2 px-5 py-5">
        <Image src={BRAND.logo} alt="PureTask" width={32} height={32} className="h-8 w-auto" />
        <span className="text-lg font-bold tracking-tight text-brand-900">PureTask</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.primary.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActiveHref(pathname, item)} />
        ))}
        <div className="my-3 border-t border-neutral-100" />
        {nav.secondary.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActiveHref(pathname, item)} />
        ))}
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
  );
};
