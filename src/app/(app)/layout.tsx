import Link from 'next/link';

import { signOutAction } from '@/features/auth/actions';

const AppShellLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/app" className="font-semibold">
            PureTask
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/app/cleaners" className="text-sm text-zinc-600 hover:text-zinc-900">
              Find a Cleaner
            </Link>
            <Link href="/app/bookings" className="text-sm text-zinc-600 hover:text-zinc-900">
              My Bookings
            </Link>
            <Link href="/app/cleaner" className="text-sm text-zinc-600 hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/app/settings" className="text-sm text-zinc-600 hover:text-zinc-900">
              Settings
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="rounded border px-3 py-1.5 text-sm">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
};

export default AppShellLayout;
