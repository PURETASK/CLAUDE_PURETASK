import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { signOutAction } from '@/features/auth/actions';
import { getCurrentUser } from '@/features/customer/queries';

const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
    <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
      {children}
    </Card>
  </section>
);

const SettingsLandingPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;
  const initial = (user.full_name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>

      {/* Profile */}
      <Card elevation={1} className="border border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base font-semibold text-neutral-400">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {user.full_name ?? 'Your account'}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {user.email}
              {memberSince ? ` · Member since ${memberSince}` : ''}
            </p>
          </div>
          <Link
            href="/app/settings/profile"
            className="flex-shrink-0 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            Edit
          </Link>
        </div>
      </Card>

      <Group label="Account">
        <ListRow href="/app/settings/profile" title="Personal info" subtitle="Name, email, phone" />
        <ListRow
          href="/app/settings/addresses"
          title="Saved addresses"
          subtitle="Service locations for booking"
        />
        <ListRow
          href="/app/settings/payment-methods"
          title="Payment methods"
          subtitle="Cards used for bookings"
        />
        <ListRow
          href="/app/settings/security"
          title="Sign-in & security"
          subtitle="Password, 2FA, sessions"
        />
      </Group>

      <Group label="Preferences">
        <ListRow
          href="/app/settings/privacy"
          title="Privacy & photos"
          subtitle="Photo policy, room exclusions"
        />
        <ListRow
          href="/app/settings/notifications"
          title="Notifications"
          subtitle="Bookings, messages, marketing"
        />
        <ListRow
          href="/app/settings/integrations"
          title="Integrations"
          subtitle="Server service status"
        />
      </Group>

      <Group label="Support & legal">
        <ListRow href="/app/support" title="Contact support" />
        <ListRow href="/help" title="Help center" />
        <ListRow href="/legal/photography-policy" title="Photography & privacy policy" />
      </Group>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-error transition-colors hover:bg-error-light"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          Sign out
        </button>
      </form>

      <p className="text-center text-xs text-neutral-400">PureTask v1.0.0</p>
    </div>
  );
};

export default SettingsLandingPage;
