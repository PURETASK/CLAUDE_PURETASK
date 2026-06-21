import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { TierBadge } from '@/features/discovery/components/TierBadge';
import type { CleanerBrowseRow } from '@/features/discovery/queries';
import { ICONS } from '@/lib/assets';
import { cn } from '@/lib/utils/cn';

type Variant = 'card' | 'row' | 'compact';

type Props = {
  cleaner: CleanerBrowseRow;
  distanceMiles?: number | null;
  /** card = self-contained tile (default) · row = list row · compact = portrait carousel tile. */
  variant?: Variant;
  /** Highlight a featured (top-tier) card with a brand-tinted border. */
  highlight?: boolean;
};

function lowestRate(cleaner: CleanerBrowseRow): number | null {
  const rates = Object.values(cleaner.hourly_rates_cents)
    .filter((r) => r > 0)
    .sort((a, b) => a - b);
  return rates[0] ?? null;
}

const Thumb = ({ size }: { size: number }) => (
  <div
    className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50"
    style={{ width: size, height: size }}
  >
    <Image
      src={ICONS.contacts}
      alt=""
      width={Math.round(size * 0.5)}
      height={Math.round(size * 0.5)}
      className="opacity-50"
    />
  </div>
);

const Meta = ({
  cleaner,
  distanceMiles,
}: {
  cleaner: CleanerBrowseRow;
  distanceMiles?: number | null;
}) => (
  <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-neutral-500">
    {cleaner.average_rating != null ? (
      <span className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-warning text-warning" strokeWidth={0} />
        <span className="font-medium text-neutral-700">{cleaner.average_rating.toFixed(1)}</span>
      </span>
    ) : (
      <span className="font-medium text-neutral-700">New</span>
    )}
    <span>· {cleaner.completed_booking_count} cleanings</span>
    {distanceMiles != null && <span>· {distanceMiles.toFixed(1)} mi</span>}
  </span>
);

export const CleanerCard = ({ cleaner, distanceMiles, variant = 'card', highlight }: Props) => {
  const rate = lowestRate(cleaner);
  const rateLabel = rate != null ? `$${Math.round(rate / 100)}/hr` : '';
  const href = `/app/cleaners/${cleaner.id}`;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className="w-32 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-neutral-300"
      >
        <div className="relative flex aspect-[4/5] items-start bg-neutral-100 p-2">
          <span className="z-10 rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-neutral-600 shadow-tier1">
            New
          </span>
          <Image
            src={ICONS.contacts}
            alt=""
            width={40}
            height={40}
            className="absolute inset-0 m-auto opacity-40"
          />
        </div>
        <div className="p-2">
          <p className="truncate text-xs font-semibold text-neutral-900">{cleaner.full_name}</p>
          <p className="mt-0.5 truncate text-[11px] text-neutral-500">
            {[rateLabel, distanceMiles != null ? `${distanceMiles.toFixed(1)} mi` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'row') {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-neutral-50"
      >
        <Thumb size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {cleaner.full_name}
            </span>
            {rateLabel && (
              <span className="flex-shrink-0 text-sm font-semibold text-neutral-900">
                {rateLabel}
              </span>
            )}
          </div>
          <div className="mt-1">
            <Meta cleaner={cleaner} distanceMiles={distanceMiles} />
          </div>
          <div className="mt-1.5">
            <TierBadge tier={cleaner.current_tier} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex gap-3 rounded-2xl border bg-white p-4 shadow-tier1 transition-all duration-card hover:-translate-y-0.5 hover:shadow-tier2',
        highlight ? 'border-brand-200 bg-brand-50/30' : 'border-neutral-200',
      )}
    >
      <Thumb size={64} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">
            {cleaner.full_name}
          </span>
          {rateLabel && (
            <span className="flex-shrink-0 text-sm font-semibold text-neutral-900">
              {rateLabel}
            </span>
          )}
        </div>
        <div className="mt-1">
          <Meta cleaner={cleaner} distanceMiles={distanceMiles} />
        </div>
        <div className="mt-2">
          <TierBadge tier={cleaner.current_tier} />
        </div>
      </div>
    </Link>
  );
};
