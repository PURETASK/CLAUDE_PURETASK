import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { TrustCallout } from '@/components/ui/trust-callout';
import { toggleInstantPayoutAction } from '@/features/payments/actions';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils/cn';

import { BioEditForm } from './BioEditForm';

export default async function CleanerSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('cleaner_profiles')
    .select(
      'id, instant_payout_enabled, bio, stripe_connect_account_id, stripe_connect_onboarding_completed_at',
    )
    .eq('user_id', user.id)
    .single();

  if (!profile) notFound();

  async function toggleAction(): Promise<void> {
    'use server';
    await toggleInstantPayoutAction(!profile!.instant_payout_enabled);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Cleaner settings</h1>

      {/* Payout preferences */}
      <Card elevation={1} className="border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-900">Instant payouts</p>
            <p className="text-xs text-neutral-400">
              Get paid immediately for a 5% fee. Standard payouts (free) arrive every Friday.
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              role="switch"
              aria-checked={profile.instant_payout_enabled}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                profile.instant_payout_enabled ? 'bg-brand-600' : 'bg-neutral-200',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  profile.instant_payout_enabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </form>
        </div>
        {!profile.stripe_connect_account_id && (
          <div className="mt-4">
            <TrustCallout variant="warning">
              Complete Stripe Connect setup to enable payouts.{' '}
              <Link href="/cleaner/connect-onboarding" className="font-medium underline">
                Set up payouts →
              </Link>
            </TrustCallout>
          </div>
        )}
      </Card>

      {/* Bio */}
      <Card elevation={1} className="border border-neutral-200 p-5">
        <p className="text-base font-semibold text-neutral-900">Profile bio</p>
        <p className="mb-4 mt-1 text-sm text-neutral-500">
          Your bio appears on your public profile and is visible to potential customers.
        </p>
        <BioEditForm currentBio={profile.bio} />
      </Card>

      {/* Verification & taxes */}
      <section className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Verification &amp; taxes
        </p>
        <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
          <ListRow
            href="/cleaner/settings/insurance"
            title="Insurance verification"
            subtitle="Upload a policy for the Insurance Verified badge"
          />
          <ListRow
            href="/cleaner/background-check"
            title="Background check"
            subtitle="Track your Checkr screening"
          />
          <ListRow
            href="/cleaner/settings/tax"
            title="Tax information"
            subtitle="W-9 details for your 1099"
          />
          <ListRow
            href="/cleaner/verify-identity"
            title="Identity verification"
            subtitle="Stripe Identity"
          />
        </Card>
      </section>

      {/* Account */}
      <section className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Account
        </p>
        <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
          <ListRow href="/app/cleaner/earnings" title="Earnings" />
          <ListRow href="/app/cleaner/availability" title="Availability" />
          <ListRow href="/app/cleaner/score" title="Reliability score" />
          <ListRow href="/cleaner/connect-onboarding" title="Stripe Connect" />
        </Card>
      </section>
    </div>
  );
}
