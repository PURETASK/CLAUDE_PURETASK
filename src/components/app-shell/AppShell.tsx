'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import type { NotificationRow } from '@/features/notifications/queries';

import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { BottomTabBar } from './BottomTabBar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { getNav } from './nav-config';

type Props = {
  role: string;
  userId: string | null;
  notifications: NotificationRow[];
  children: ReactNode;
};

/**
 * The authenticated app shell: a clean, wireframe-style chrome with a desktop
 * sidebar, a mobile bottom tab bar, and a slim sticky header. Replaces the
 * previous dark "bubble" shell. Role-aware navigation comes from `nav-config`.
 */
export const AppShell = ({ role, userId, notifications, children }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = getNav(role);
  const homeHref = nav.primary[0]?.href ?? '/app';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <AppSidebar nav={nav} homeHref={homeHref} />

      <div className="md:pl-64">
        <AppHeader
          userId={userId}
          notifications={notifications}
          homeHref={homeHref}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-10"
        >
          {children}
        </main>
      </div>

      <BottomTabBar items={nav.primary} />
      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} nav={nav} />
    </div>
  );
};
