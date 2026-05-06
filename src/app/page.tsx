import { createSupabaseServerClient } from '@/lib/supabase/server';

const HomePage = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('smoke_test').select('*').limit(1);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">PureTask</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Phase 1 smoke test</p>
      {error ? (
        <pre className="w-full max-w-3xl overflow-x-auto rounded bg-red-50 p-4 text-red-900">
          Error: {error.message}
        </pre>
      ) : (
        <pre className="w-full max-w-3xl overflow-x-auto rounded bg-green-50 p-4 text-green-900">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
};

export default HomePage;
