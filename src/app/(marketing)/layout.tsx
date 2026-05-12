import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/assets';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="PureTask" width={32} height={32} className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight text-brand-900">PureTask</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 sm:flex">
            <Link
              href="/how-it-works"
              className="transition-colors duration-micro hover:text-brand-600"
            >
              How it works
            </Link>
            <Link href="/pricing" className="transition-colors duration-micro hover:text-brand-600">
              Pricing
            </Link>
            <Link href="/faq" className="transition-colors duration-micro hover:text-brand-600">
              FAQ
            </Link>
            <Link
              href="/for-cleaners"
              className="transition-colors duration-micro hover:text-brand-600"
            >
              For cleaners
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-neutral-600 transition-colors duration-micro hover:text-brand-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all duration-control hover:shadow-tier2 hover:brightness-110 active:scale-[0.98]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-neutral-200 bg-neutral-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-900">Platform</p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <Link href="/how-it-works" className="transition-colors hover:text-brand-600">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition-colors hover:text-brand-600">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="transition-colors hover:text-brand-600">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-900">Cleaners</p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <Link href="/for-cleaners" className="transition-colors hover:text-brand-600">
                    Why PureTask
                  </Link>
                </li>
                <li>
                  <Link href="/cleaner/apply" className="transition-colors hover:text-brand-600">
                    Apply now
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-900">Account</p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <Link href="/auth/sign-up" className="transition-colors hover:text-brand-600">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-in" className="transition-colors hover:text-brand-600">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-neutral-900">Legal</p>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>
                  <Link
                    href="/legal/photography-policy"
                    className="transition-colors hover:text-brand-600"
                  >
                    Photo policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <p className="text-xs text-neutral-400">
              © {new Date().getFullYear()} PureTask. Northern California&apos;s trusted cleaning
              marketplace.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
