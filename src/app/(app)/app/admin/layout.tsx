import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Gate for the in-app admin surface (/app/admin/*).
 *
 * These pages render inside the regular app shell, so without this layout they
 * had no access-control check at all — any authenticated user could open
 * /app/admin/disputes or /app/admin/support. We treat a user as an admin if
 * they have an admin_profiles row OR users.primary_role === 'admin' (the two
 * mechanisms used elsewhere in the codebase).
 */
const AppAdminLayout = async ({ children }: { children: React.ReactNode }) => {
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
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-4 border-b border-neutral-200 pb-3 text-sm">
        <span className="font-semibold uppercase tracking-wide text-neutral-700">Admin</span>
        <Link href="/admin" className="text-neutral-500 hover:text-brand-600">
          Dashboard
        </Link>
        <Link href="/applications" className="text-neutral-500 hover:text-brand-600">
          Applications
        </Link>
        <Link href="/app/admin/disputes" className="text-neutral-500 hover:text-brand-600">
          Disputes
        </Link>
        <Link href="/app/admin/support" className="text-neutral-500 hover:text-brand-600">
          Support
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default AppAdminLayout;
