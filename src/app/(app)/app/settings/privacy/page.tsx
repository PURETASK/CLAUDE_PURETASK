import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PhotoPolicyForm } from '@/features/customer/components/PhotoPolicyForm';
import { StubCard } from '@/features/customer/components/StubCard';
import { getCurrentUser, getCustomerProfile } from '@/features/customer/queries';

const SettingsPrivacyPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const profile = await getCustomerProfile();
  if (!profile) redirect('/app/settings');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/app/settings" className="text-sm text-neutral-500 hover:text-neutral-900">
          Settings
        </Link>
        <span className="text-neutral-300">/</span>
        <h1 className="text-xl font-semibold">Privacy Preferences</h1>
      </div>

      <div className="max-w-2xl rounded border bg-white p-4">
        <p className="mb-3 text-sm text-neutral-600">
          Photos protect both you and your cleaner by creating transparent proof of completed work.
          Photos are encrypted at rest and automatically deleted after 90 days by policy.
        </p>
        <Link href="/legal/photography-policy" className="mb-4 inline-block text-sm underline">
          Read full Photography Policy
        </Link>
        {/* PENDING_LAWYER_REVIEW: final photography waiver and legal policy copy */}
        <PhotoPolicyForm
          defaultValues={{
            photo_policy: profile.photo_policy as
              | 'default'
              | 'skip_named_rooms'
              | 'skip_all_with_waiver',
            skip_photo_rooms: profile.skip_photo_rooms ?? [],
          }}
        />
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <StubCard
          title="Download your data"
          description="Export your bookings, messages, and photos."
          phaseBadge="Coming pre-launch (CCPA)"
        />
        <StubCard
          title="Request earlier photo deletion"
          description="Delete photos before the 90-day automatic deletion window."
          phaseBadge="Coming pre-launch"
        />
        <StubCard
          title="California privacy rights"
          description="CCPA opt-out and data rights controls."
          phaseBadge="Coming pre-launch"
        />
        <StubCard
          title="Account deletion"
          description="Permanently delete your account with safety checks."
          phaseBadge="Coming pre-launch"
        />
      </div>
    </div>
  );
};

export default SettingsPrivacyPage;
