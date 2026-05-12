import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/assets';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <Image src={BRAND.logo} alt="PureTask" width={56} height={56} className="mb-6 drop-shadow-md" />
      <p className="mb-2 text-8xl font-black text-neutral-200">404</p>
      <h1 className="mb-3 text-2xl font-bold text-neutral-900">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Go home
        </Link>
        <Link
          href="/app"
          className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Open app
        </Link>
      </div>
    </main>
  );
}
