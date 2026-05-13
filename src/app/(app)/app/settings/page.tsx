import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ProfileHeader } from '@/features/customer/components/ProfileHeader';
import { SettingsLayout } from '@/features/customer/components/SettingsLayout';
import { getCurrentUser } from '@/features/customer/queries';
import { ICONS } from '@/lib/assets';

const SettingsLandingPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <SettingsLayout
      title="Customer Settings"
      subtitle="Manage your account profile, service addresses, and privacy preferences."
      icon={ICONS.settings}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProfileHeader fullName={user.full_name} email={user.email} createdAt={user.created_at} />

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Service Addresses</h3>
          <p className="mt-2 text-sm text-neutral-700">
            Add, edit, and choose a default address for future bookings.
          </p>
          <Link
            href="/app/settings/addresses"
            className="mt-3 inline-block rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Manage addresses
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
          <p className="mt-2 text-sm text-neutral-700">
            Email notification preferences for bookings and disputes.
          </p>
          <Link
            href="/app/settings/notifications"
            className="mt-3 inline-block rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Manage notifications
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Payment Methods</h3>
          <p className="mt-2 text-sm text-neutral-700">Add and manage cards for booking.</p>
          <Link
            href="/app/settings/payment-methods"
            className="mt-3 inline-block rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Manage cards
          </Link>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Security</h3>
          <p className="mt-2 text-sm text-neutral-700">
            Enable two-factor authentication to protect your account.
          </p>
          <Link
            href="/app/settings/security"
            className="mt-3 inline-block rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Manage security
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">Privacy + Data</h3>
          <p className="mt-2 text-sm text-neutral-700">
            Configure photo handling and review privacy-related controls.
          </p>
          <Link
            href="/app/settings/privacy"
            className="mt-3 inline-block rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Open privacy settings
          </Link>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsLandingPage;
