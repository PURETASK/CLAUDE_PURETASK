import Image from 'next/image';
import Link from 'next/link';

import { signOutAction } from '@/features/auth/actions';
import { getRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/components/NotificationBell';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BRAND } from '@/lib/assets';

const navLinkClass =
  'text-sm font-medium text-neutral-600 transition-colors duration-micro hover:text-brand-600';

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
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 shadow-tier1 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href={isCleaner ? '/app/cleaner' : '/app'} className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="PureTask" width={32} height={32} className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight text-brand-900">PureTask</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isClient && (
              <>
                <Link href="/app/cleaners" className={navLinkClass}>
                  Find a Cleaner
                </Link>
                <Link href="/app/bookings" className={navLinkClass}>
                  My Bookings
                </Link>
                <Link href="/app/recurring" className={navLinkClass}>
                  Recurring
                </Link>
                <Link href="/app/favorites" className={navLinkClass}>
                  Favorites
                </Link>
                <Link href="/app/dashboard" className={navLinkClass}>
                  Dashboard
                </Link>
              </>
            )}

            {isCleaner && (
              <>
                <Link href="/app/cleaner/bookings" className={navLinkClass}>
                  My Jobs
                </Link>
                <Link href="/app/cleaner/availability" className={navLinkClass}>
                  Availability
                </Link>
                <Link href="/app/cleaner/earnings" className={navLinkClass}>
                  Earnings
                </Link>
                <Link href="/app/cleaner/score" className={navLinkClass}>
                  My Score
                </Link>
              </>
            )}

            <Link href="/app/support" className={navLinkClass}>
              Support
            </Link>
            <Link href="/app/settings" className={navLinkClass}>
              Settings
            </Link>

            <Link href="/app/notifications" className={navLinkClass}>
              Notifications
            </Link>

            {user && <NotificationBell initialNotifications={notifications} userId={user.id} />}

            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all duration-control hover:border-neutral-300 hover:bg-neutral-50"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
};

export default AppShellLayout;
