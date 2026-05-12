import Image from 'next/image';
import Link from 'next/link';

import { signOutAction } from '@/features/auth/actions';
import { getRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/components/NotificationBell';
import { NavLink } from '@/components/NavLink';
import { MobileNav } from '@/components/MobileNav';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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

const AppShellLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string) ?? 'customer';
  const isClient = role === 'customer';
  const isCleaner = role === 'cleaner';

  const notifications = user ? await getRecentNotifications(20) : [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 shadow-tier1 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href={isCleaner ? '/app/cleaner' : '/app'} className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="PureTask" width={32} height={32} className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight text-brand-900">PureTask</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {isClient && (
              <>
                <NavLink href="/app/cleaners">Find a Cleaner</NavLink>
                <NavLink href="/app/bookings">My Bookings</NavLink>
                <NavLink href="/app/recurring">Recurring</NavLink>
                <NavLink href="/app/favorites">Favorites</NavLink>
                <NavLink href="/app/dashboard">Dashboard</NavLink>
              </>
            )}
            {isCleaner && (
              <>
                <NavLink href="/app/cleaner/bookings">My Jobs</NavLink>
                <NavLink href="/app/cleaner/availability">Availability</NavLink>
                <NavLink href="/app/cleaner/earnings">Earnings</NavLink>
                <NavLink href="/app/cleaner/score">My Score</NavLink>
              </>
            )}
            <NavLink href="/app/support">Support</NavLink>
            <NavLink href="/app/settings">Settings</NavLink>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell initialNotifications={notifications} userId={user.id} />}

            <form action={signOutAction} className="hidden md:block">
              <button
                type="submit"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all duration-control hover:border-neutral-300 hover:bg-neutral-50"
              >
                Sign out
              </button>
            </form>

            {/* Mobile nav */}
            <MobileNav
              customerLinks={CUSTOMER_LINKS}
              cleanerLinks={CLEANER_LINKS}
              role={role}
              onSignOut={signOutAction}
            />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
};

export default AppShellLayout;
