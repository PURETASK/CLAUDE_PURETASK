import { AppShell } from '@/components/app-shell/AppShell';
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt';
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
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <ExperienceFonts>
      <AppShell role={role} userId={user?.id ?? null} notifications={notifications}>
        {children}
        {user && vapidPublicKey && <PushPermissionPrompt vapidPublicKey={vapidPublicKey} />}
      </AppShell>
    </ExperienceFonts>
  );
};

export default AppShellLayout;
