import Image from 'next/image';

import { getBookingPhotos, signedUrlForPhoto } from '@/features/verification/queries';

type Props = { bookingId: string };

export const PhotoGrid = async ({ bookingId }: Props) => {
  const photos = await getBookingPhotos(bookingId);
  if (photos.length === 0) {
    return <p className="text-sm text-zinc-500">No photos uploaded yet.</p>;
  }

  const withUrls = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await signedUrlForPhoto(p.storage_key) })),
  );

  const before = withUrls.filter((p) => p.purpose === 'before_clock_in');
  const after = withUrls.filter((p) => p.purpose === 'after_clock_out');

  return (
    <div className="flex flex-col gap-4">
      {before.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Before ({before.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {before.map((p) =>
              p.url ? (
                <Image
                  key={p.id}
                  src={p.url}
                  alt="Before clean"
                  width={200}
                  height={200}
                  className="aspect-square rounded object-cover"
                  unoptimized
                />
              ) : null,
            )}
          </div>
        </div>
      )}
      {after.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">After ({after.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {after.map((p) =>
              p.url ? (
                <Image
                  key={p.id}
                  src={p.url}
                  alt="After clean"
                  width={200}
                  height={200}
                  className="aspect-square rounded object-cover"
                  unoptimized
                />
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
};
