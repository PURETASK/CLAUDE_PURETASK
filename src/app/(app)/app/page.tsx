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
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {me?.full_name ? `Welcome back, ${me.full_name.split(' ')[0]}` : 'Welcome to PureTask'}
        </h1>
        <p className="mt-2 text-base text-slate-700">
          Find a vetted cleaner in Northern California.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
          What do you need?
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SERVICE_CARDS.map((s) => (
            <Link
              key={s.type}
              href={`/app/cleaners?service=${s.type}`}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold text-slate-900">{s.label}</span>
              <span className="text-sm text-slate-600">{s.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/app/cleaners"
        className="self-start rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Browse all cleaners
      </Link>
    </div>
  );
};

export default AppHomePage;
