import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { PhotoPolicyForm } from '@/features/customer/components/PhotoPolicyForm';
import { StubCard } from '@/features/customer/components/StubCard';
import { getCurrentUser, getCustomerProfile } from '@/features/customer/queries';

const SettingsPrivacyPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const profile = await getCustomerProfile();
  if (!profile) redirect('/app/settings');

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Privacy &amp; photos</h1>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-5">
        <p className="mb-3 text-sm leading-relaxed text-neutral-600">
          Photos protect both you and your cleaner by creating transparent proof of completed work.
          Photos are encrypted at rest and automatically deleted after 90 days by policy.
        </p>
        <Link
          href="/legal/photography-policy"
          className="mb-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Read full Photography Policy →
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
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
