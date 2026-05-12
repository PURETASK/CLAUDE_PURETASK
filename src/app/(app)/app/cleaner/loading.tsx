export default function CleanerDashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 py-8">
      <div className="h-7 w-40 rounded bg-neutral-200" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}
