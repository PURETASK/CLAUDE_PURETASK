import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const SERVICE_CARDS = [
  {
    type: 'standard',
    label: 'Standard clean',
    desc: 'Regular tidying and cleaning of all rooms.',
  },
  {
    type: 'deep',
    label: 'Deep clean',
    desc: 'Detailed scrub of every surface — great for first visits.',
  },
  {
    type: 'move_out',
    label: 'Move-out clean',
    desc: 'End-of-tenancy full clean to get your deposit back.',
  },
  {
    type: 'airbnb',
    label: 'Airbnb turnover',
    desc: 'Quick, reliable turnaround between short-term guests.',
  },
];

const AppHomePage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase.from('users').select('full_name').eq('id', user.id).single();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          {me?.full_name ? `Welcome back, ${me.full_name.split(' ')[0]}` : 'Welcome to PureTask'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Find a vetted cleaner in Northern California.</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-zinc-500">What do you need?</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SERVICE_CARDS.map((s) => (
            <Link
              key={s.type}
              href={`/app/cleaners?service=${s.type}`}
              className="flex flex-col gap-1 rounded border bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-xs text-zinc-500">{s.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/app/cleaners"
        className="self-start rounded bg-black px-6 py-2.5 text-sm text-white hover:bg-zinc-800"
      >
        Browse all cleaners
      </Link>
    </div>
  );
};

export default AppHomePage;
