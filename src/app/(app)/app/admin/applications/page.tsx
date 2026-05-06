import { redirect } from 'next/navigation';

import { AdminApplicationList } from '@/features/cleaner/components/AdminApplicationList';
import { listApplications } from '@/features/cleaner/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AdminApplicationsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase
    .from('users')
    .select('primary_role')
    .eq('id', user.id)
    .single();

  if (me?.primary_role !== 'admin') redirect('/app');

  const applications = await listApplications(['submitted', 'in_review', 'needs_info']);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Applications</h1>
      <div className="max-w-2xl">
        <AdminApplicationList
          applications={applications.map((a) => ({
            ...a,
            users: Array.isArray(a.users)
              ? (a.users[0] ?? null)
              : (a.users as { full_name: string; email: string } | null),
          }))}
        />
      </div>
    </div>
  );
};

export default AdminApplicationsPage;
