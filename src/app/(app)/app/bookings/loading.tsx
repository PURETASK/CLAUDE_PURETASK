export default function BookingsLoading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-32 rounded bg-zinc-200" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-zinc-100" />
      ))}
    </div>
  );
}
