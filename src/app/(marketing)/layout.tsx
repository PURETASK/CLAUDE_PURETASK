import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
            PureTask
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 sm:flex">
            <Link href="/how-it-works" className="hover:text-zinc-900">
              How it works
            </Link>
            <Link href="/pricing" className="hover:text-zinc-900">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-zinc-900">
              FAQ
            </Link>
            <Link href="/for-cleaners" className="hover:text-zinc-900">
              For cleaners
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Platform</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/how-it-works" className="hover:text-zinc-800">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-zinc-800">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-zinc-800">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Cleaners</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/for-cleaners" className="hover:text-zinc-800">
                    Why PureTask
                  </Link>
                </li>
                <li>
                  <Link href="/cleaner/apply" className="hover:text-zinc-800">
                    Apply now
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Account</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/auth/sign-up" className="hover:text-zinc-800">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="hover:text-zinc-800">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-900">Legal</p>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>
                  <Link href="/legal/photography-policy" className="hover:text-zinc-800">
                    Photo policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-zinc-200 pt-6">
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} PureTask. Northern California&apos;s trusted cleaning
              marketplace.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
