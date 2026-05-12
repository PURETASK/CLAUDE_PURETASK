'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

import { BRAND } from '@/lib/assets';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Image src={BRAND.dash} alt="" width={72} height={72} className="mb-5 opacity-70 drop-shadow-md" />
      <h2 className="mb-2 text-xl font-bold text-neutral-900">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">
        An unexpected error occurred. Your data is safe — try reloading the page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
