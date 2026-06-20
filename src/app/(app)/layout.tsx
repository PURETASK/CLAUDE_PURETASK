import { getRecentNotifications } from '@/features/notifications/queries';
import { AppBubbleShell } from '@/features/experience/components/AppBubbleShell';
import { ExperienceFonts } from '@/features/experience/components/ExperienceFonts';
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
      <AppBubbleShell role={role} userId={user?.id ?? null} notifications={notifications}>
        {children}
      </AppBubbleShell>
    </ExperienceFonts>
  );
};

export default AppShellLayout;
