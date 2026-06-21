import { redirect } from 'next/navigation';

import { AdminMobileNav, AdminSidebar } from '@/features/admin/components/AdminSidebar';
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

  const [appsRes, disputesRes] = await Promise.all([
    supabase
      .from('cleaner_applications')
      .select('id', { count: 'exact', head: true })
      .eq('state', 'submitted'),
    supabase
      .from('disputes')
      .select('id', { count: 'exact', head: true })
      .in('state', ['open', 'escalated', 'in_mediation']),
  ]);

  const counts = {
    applications: appsRes.count ?? 0,
    disputes: disputesRes.count ?? 0,
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <AdminSidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav counts={counts} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
