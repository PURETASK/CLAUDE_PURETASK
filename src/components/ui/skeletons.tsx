export const CleanerDashboardSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 rounded-full bg-neutral-200" />
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-neutral-200" />
        <div className="h-3 w-24 rounded bg-neutral-200" />
      </div>
    </div>
    <div className="h-24 rounded-xl bg-neutral-200" />
    <div className="h-32 rounded-xl bg-neutral-200" />
  </div>
);

export const CleanerListSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 rounded-xl border border-neutral-200 p-4">
        <div className="h-14 w-14 flex-shrink-0 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-neutral-200" />
          <div className="h-3 w-24 rounded bg-neutral-200" />
          <div className="h-3 w-32 rounded bg-neutral-200" />
        </div>
      </div>
    ))}
  </div>
);

export const PhotoUploadSkeleton = ({ current, total }: { current: number; total: number }) => (
  <div className="flex flex-col items-center gap-4 p-6">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
    <p className="text-sm text-neutral-600">
      Uploading room {current} of {total}…
    </p>
  </div>
);

export const CardSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5">
    <div className="mb-3 h-4 w-24 rounded bg-neutral-200" />
    <div className="h-8 w-32 rounded bg-neutral-200" />
  </div>
);
