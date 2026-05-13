import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Single gate + chrome for the entire admin surface (/admin/*).
 *
 * We treat a user as an admin if they have an admin_profiles row OR if
 * users.primary_role === 'admin' — both mechanisms exist in the codebase and
 * different historical admin pages used one or the other. Belt-and-suspenders.
 */
const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [{ data: adminProfile }, { data: me }] = await Promise.all([
    supabase.from('admin_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('primary_role').eq('id', user.id).maybeSingle(),
  ]);

  if (!adminProfile && me?.primary_role !== 'admin') redirect('/app');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="text-sm font-semibold uppercase tracking-wide text-brand-900"
          >
            PureTask Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin" className="text-neutral-500 transition-colors hover:text-brand-600">
              Dashboard
            </Link>
            <Link
              href="/admin/applications"
              className="text-neutral-500 transition-colors hover:text-brand-600"
            >
              Applications
            </Link>
            <Link
              href="/admin/bookings"
              className="text-neutral-500 transition-colors hover:text-brand-600"
            >
              Bookings
            </Link>
            <Link
              href="/admin/disputes"
              className="text-neutral-500 transition-colors hover:text-brand-600"
            >
              Disputes
            </Link>
            <Link
              href="/admin/support"
              className="text-neutral-500 transition-colors hover:text-brand-600"
            >
              Support
            </Link>
            <Link href="/app" className="text-neutral-400 transition-colors hover:text-brand-600">
              ← App
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
