import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ProfileHeader } from '@/features/customer/components/ProfileHeader';
import { SettingsLayout } from '@/features/customer/components/SettingsLayout';
import { StubCard } from '@/features/customer/components/StubCard';
import { getCurrentUser } from '@/features/customer/queries';

const SettingsLandingPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <SettingsLayout
      title="Customer Settings"
      subtitle="Manage your account profile, service addresses, and privacy preferences."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProfileHeader fullName={user.full_name} email={user.email} createdAt={user.created_at} />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Service Addresses</h3>
          <p className="mt-2 text-sm text-slate-700">
            Add, edit, and choose a default address for future bookings.
          </p>
          <Link
            href="/settings/addresses"
            className="mt-3 inline-block rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Manage addresses
          </Link>
        </div>

        <StubCard
          title="Notifications"
          description="Push, email, and SMS notification preferences."
          phaseBadge="Coming in Phase 10"
        />
        <StubCard
          title="Payment Methods"
          description="Add and manage cards for booking."
          phaseBadge="Coming in Phase 6a"
        />
        <StubCard
          title="Security"
          description="Two-factor auth and active session management."
          phaseBadge="Coming pre-launch"
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Privacy + Data</h3>
          <p className="mt-2 text-sm text-slate-700">
            Configure photo handling and review privacy-related controls.
          </p>
          <Link
            href="/settings/privacy"
            className="mt-3 inline-block rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Open privacy settings
          </Link>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsLandingPage;
