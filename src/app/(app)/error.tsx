'use client';

import { useEffect } from 'react';

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
      <p className="mb-2 text-4xl">⚠</p>
      <h2 className="mb-2 text-lg font-semibold text-zinc-900">Something went wrong</h2>
      <p className="mb-6 max-w-sm text-sm text-zinc-500">
        An unexpected error occurred. Your data is safe — try reloading the page.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Try again
      </button>
    </div>
  );
}
