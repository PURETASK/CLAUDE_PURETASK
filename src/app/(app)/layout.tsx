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
          <form action={signOutAction}>
            <button type="submit" className="rounded border px-3 py-1.5 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
};

export default AppShellLayout;
