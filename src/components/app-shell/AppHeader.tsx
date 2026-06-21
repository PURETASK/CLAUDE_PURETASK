'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { NotificationBell } from '@/components/NotificationBell';
import type { NotificationRow } from '@/features/notifications/queries';
import { BRAND } from '@/lib/assets';

type Props = {
  userId: string | null;
  notifications: NotificationRow[];
  homeHref: string;
  onOpenMenu: () => void;
};

export const AppHeader = ({ userId, notifications, homeHref, onOpenMenu }: Props) => (
  <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
    <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
      {/* Brand — mobile only; desktop shows it in the sidebar */}
      <Link href={homeHref} className="flex items-center gap-2 md:hidden">
        <Image src={BRAND.logo} alt="PureTask" width={28} height={28} className="h-7 w-auto" />
        <span className="text-base font-bold tracking-tight text-brand-900">PureTask</span>
      </Link>
      <div className="hidden md:block" aria-hidden />

      <div className="flex items-center gap-1">
        {userId && <NotificationBell initialNotifications={notifications} userId={userId} />}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-neutral-600 transition-colors duration-control hover:bg-neutral-100 md:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  </header>
);
