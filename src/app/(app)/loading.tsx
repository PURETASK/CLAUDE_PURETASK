export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-6 h-7 w-48 rounded-lg bg-neutral-200" />
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
