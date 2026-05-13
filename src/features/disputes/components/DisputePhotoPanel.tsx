import Image from 'next/image';

interface Photo {
  id: string;
  cdn_url: string;
  purpose: string;
  room_label: string | null;
}

interface Props {
  customerDescription: string;
  customerPhotos: Photo[];
  cleanerPhotos: Photo[];
}

export const DisputePhotoPanel = ({
  customerDescription,
  customerPhotos,
  cleanerPhotos,
}: Props) => {
  const cleanerBefore = cleanerPhotos.filter((p) => p.purpose === 'before_clock_in');
  const cleanerAfter = cleanerPhotos.filter((p) => p.purpose === 'after_clock_out');

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-error/20 bg-error/5 p-5 space-y-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-error">
            Customer Claim
          </p>
          <p className="text-sm text-neutral-700">&ldquo;{customerDescription}&rdquo;</p>
        </div>
        {customerPhotos.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Evidence photos uploaded by customer
            </p>
            <div className="grid grid-cols-3 gap-2">
              {customerPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                >
                  <Image
                    src={photo.cdn_url}
                    alt="Customer evidence"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {customerPhotos.length === 0 && (
          <p className="text-sm text-neutral-400">No evidence photos uploaded.</p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Cleaner Photos (by room)
        </p>

        {cleanerBefore.length === 0 && cleanerAfter.length === 0 ? (
          <p className="text-sm text-neutral-400">No photos uploaded by cleaner.</p>
        ) : (
          <div className="space-y-4">
            {cleanerBefore.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-neutral-500">Before clock-in</p>
                <div className="grid grid-cols-3 gap-2">
                  {cleanerBefore.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <Image
                        src={photo.cdn_url}
                        alt={photo.room_label ?? 'Before'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cleanerAfter.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-neutral-500">After clock-out</p>
                <div className="grid grid-cols-3 gap-2">
                  {cleanerAfter.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <Image
                        src={photo.cdn_url}
                        alt={photo.room_label ?? 'After'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
