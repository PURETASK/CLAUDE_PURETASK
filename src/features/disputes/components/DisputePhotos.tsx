import Image from 'next/image';

import { Card } from '@/components/ui/card';
import type { DisputePhoto } from '@/features/disputes/queries';

const GROUPS: { purpose: string; label: string }[] = [
  { purpose: 'after_clock_out', label: 'Photos from the job' },
  { purpose: 'dispute_evidence_customer', label: "Customer's evidence" },
  { purpose: 'dispute_evidence_cleaner', label: "Cleaner's evidence" },
];

/**
 * Read-only gallery of the photos tied to a disputed booking — the cleaner's
 * clock-out documentation plus any evidence either side has attached. Renders
 * nothing when there are no usable photos, so it's safe to drop into any
 * dispute screen.
 */
export function DisputePhotos({ photos }: { photos: DisputePhoto[] }) {
  const usable = photos.filter((p) => p.cdn_url || p.thumbnail_url);
  if (usable.length === 0) return null;

  return (
    <Card elevation={1} className="border border-neutral-200 p-4">
      <p className="mb-3 text-sm font-semibold text-neutral-900">Photo evidence</p>
      <div className="flex flex-col gap-4">
        {GROUPS.map((g) => {
          const items = usable.filter((p) => p.purpose === g.purpose);
          if (items.length === 0) return null;
          return (
            <div key={g.purpose}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {g.label} · {items.length}
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                  >
                    <Image
                      src={(p.thumbnail_url ?? p.cdn_url) as string}
                      alt={p.room_label ?? 'Job photo'}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover"
                    />
                    {p.room_label && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[9px] text-white">
                        {p.room_label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
