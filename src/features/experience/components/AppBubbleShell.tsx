'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { MobileNav } from '@/components/MobileNav';
import { NotificationBell } from '@/components/NotificationBell';
import { IntegrationSetupBanner } from '@/components/shared/IntegrationSetupBanner';
import { signOutAction } from '@/features/auth/actions';
import { BubbleExperienceProvider } from '@/features/experience/bubble-experience-context';
import { BubbleNavLink } from '@/features/experience/components/BubbleNavLink';
import { BubbleViewport } from '@/features/experience/components/BubbleViewport';
import type { NotificationRow } from '@/features/notifications/queries';
import { BRAND } from '@/lib/assets';

const CUSTOMER_LINKS = [
  { label: 'Find a Cleaner', href: '/app/cleaners' },
  { label: 'My Bookings', href: '/app/bookings' },
  { label: 'Recurring', href: '/app/recurring' },
  { label: 'Favorites', href: '/app/favorites' },
  { label: 'Dashboard', href: '/app/dashboard' },
  { label: 'Support', href: '/app/support' },
  { label: 'Settings', href: '/app/settings' },
];

const CLEANER_LINKS = [
  { label: 'My Jobs', href: '/app/cleaner/bookings' },
  { label: 'Availability', href: '/app/cleaner/availability' },
  { label: 'Earnings', href: '/app/cleaner/earnings' },
  { label: 'My Score', href: '/app/cleaner/score' },
  { label: 'Support', href: '/app/support' },
  { label: 'Settings', href: '/app/settings' },
];

type Props = {
  role: string;
  userId: string | null;
  notifications: NotificationRow[];
  children: ReactNode;
};

export const AppBubbleShell = ({ role, userId, notifications, children }: Props) => {
  const isClient = role === 'customer';
  const isCleaner = role === 'cleaner';

  return (
    <BubbleExperienceProvider>
      <div className="bubble-scene min-h-screen text-neutral-900">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <header className="bubble-header bubble-chrome sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
            <Link href={isCleaner ? '/app/cleaner' : '/app'} className="flex items-center gap-2">
              <Image
                src={BRAND.logo}
                alt="PureTask"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold tracking-tight text-white">PureTask</span>
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
              {isClient && (
                <>
                  <BubbleNavLink href="/app/cleaners">Find a Cleaner</BubbleNavLink>
                  <BubbleNavLink href="/app/bookings">My Bookings</BubbleNavLink>
                  <BubbleNavLink href="/app/recurring">Recurring</BubbleNavLink>
                  <BubbleNavLink href="/app/favorites">Favorites</BubbleNavLink>
                  <BubbleNavLink href="/app/dashboard">Dashboard</BubbleNavLink>
                </>
              )}
              {isCleaner && (
                <>
                  <BubbleNavLink href="/app/cleaner/bookings">My Jobs</BubbleNavLink>
                  <BubbleNavLink href="/app/cleaner/availability">Availability</BubbleNavLink>
                  <BubbleNavLink href="/app/cleaner/earnings">Earnings</BubbleNavLink>
                  <BubbleNavLink href="/app/cleaner/score">My Score</BubbleNavLink>
                </>
              )}
              <BubbleNavLink href="/app/support">Support</BubbleNavLink>
              <BubbleNavLink href="/app/settings">Settings</BubbleNavLink>
            </nav>

            <div className="flex items-center gap-2">
              {userId && <NotificationBell initialNotifications={notifications} userId={userId} />}

              <form action={signOutAction} className="hidden md:block">
                <button
                  type="submit"
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-all duration-control hover:bg-white/20"
                >
                  Sign out
                </button>
              </form>

              <MobileNav
                customerLinks={CUSTOMER_LINKS}
                cleanerLinks={CLEANER_LINKS}
                role={role}
                onSignOut={signOutAction}
              />
            </div>
          </div>
        </header>

        <BubbleViewport>
          <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8">
            <IntegrationSetupBanner />
            {children}
          </main>
        </BubbleViewport>
      </div>
    </BubbleExperienceProvider>
  );
};
