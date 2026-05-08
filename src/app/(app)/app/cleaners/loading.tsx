export default function CleanersLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-6 w-48 rounded bg-zinc-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
