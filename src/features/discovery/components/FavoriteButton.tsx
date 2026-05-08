'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { toggleFavoriteAction } from '@/features/discovery/actions';

type Props = {
  cleanerId: string;
  initialIsFavorited: boolean;
};

export const FavoriteButton = ({ cleanerId, initialIsFavorited }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await toggleFavoriteAction(cleanerId);
          router.refresh();
        });
      }}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      disabled={isPending}
      aria-pressed={initialIsFavorited}
    >
      {isPending ? 'Saving...' : initialIsFavorited ? 'Remove from favorites' : 'Save to favorites'}
    </button>
  );
};
