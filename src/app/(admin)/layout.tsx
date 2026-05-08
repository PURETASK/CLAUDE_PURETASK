import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminProfile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Admin</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/applications" className="text-slate-700 hover:text-slate-950">
              Applications
            </Link>
            <Link href="/admin/settings" className="text-slate-700 hover:text-slate-950">
              Settings
            </Link>
            <Link href="/app" className="text-slate-700 hover:text-slate-950">
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
