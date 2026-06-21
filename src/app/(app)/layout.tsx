import { AppShell } from '@/components/app-shell/AppShell';
import { ExperienceFonts } from '@/features/experience/components/ExperienceFonts';
import { getRecentNotifications } from '@/features/notifications/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const AppShellLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string) ?? 'customer';
  const notifications = user ? await getRecentNotifications(20) : [];

  return (
    <ExperienceFonts>
      <AppShell role={role} userId={user?.id ?? null} notifications={notifications}>
        {children}
      </AppShell>
    </ExperienceFonts>
  );
};

export default AppShellLayout;
