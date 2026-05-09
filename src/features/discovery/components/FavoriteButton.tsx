'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { toggleFavoriteAction } from '@/features/discovery/actions';
import { Button } from '@/components/ui/button';

type Props = {
  cleanerId: string;
  initialIsFavorited: boolean;
};

export const FavoriteButton = ({ cleanerId, initialIsFavorited }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={initialIsFavorited ? 'secondary' : 'primary'}
      type="button"
      onClick={() => {
        startTransition(async () => {
          await toggleFavoriteAction(cleanerId);
          router.refresh();
        });
      }}
      disabled={isPending}
      aria-pressed={initialIsFavorited}
    >
      {isPending ? 'Saving…' : initialIsFavorited ? 'Remove from favorites' : 'Save to favorites'}
    </Button>
  );
};
