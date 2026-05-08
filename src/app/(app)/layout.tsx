import Link from 'next/link';

import { signOutAction } from '@/features/auth/actions';
import { getRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/components/NotificationBell';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AppShellLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const notifications = user ? await getRecentNotifications(20) : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/app" className="text-lg font-semibold tracking-tight">
            PureTask
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/app/cleaners"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Find a Cleaner
            </Link>
            <Link
              href="/app/bookings"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              My Bookings
            </Link>
            <Link
              href="/app/recurring"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Recurring
            </Link>
            <Link
              href="/app/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Dashboard
            </Link>
            <Link
              href="/app/favorites"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Favorites
            </Link>
            <Link
              href="/app/cleaner/earnings"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Earnings
            </Link>
            <Link
              href="/app/cleaner/availability"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Availability
            </Link>
            <Link
              href="/app/support"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Support
            </Link>
            <Link
              href="/app/settings"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Settings
            </Link>
            {user && (
              <NotificationBell initialNotifications={notifications} userId={user.id} />
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
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
