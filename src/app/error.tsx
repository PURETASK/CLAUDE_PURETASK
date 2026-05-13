'use client';

import Image from 'next/image';
import { useEffect } from 'react';

import { BRAND } from '@/lib/assets';

export default function GlobalError({
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
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
        <Image
          src={BRAND.logo}
          alt="PureTask"
          width={56}
          height={56}
          className="mb-6 drop-shadow-md"
        />
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Something went wrong</h1>
        <p className="mb-8 max-w-sm text-sm text-neutral-500">
          An unexpected error occurred. Your data is safe — try reloading.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
