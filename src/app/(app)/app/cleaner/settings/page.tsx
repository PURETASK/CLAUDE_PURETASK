import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toggleInstantPayoutAction } from '@/features/payments/actions';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/app/cleaner" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Cleaner settings</h1>
        <p className="text-sm text-zinc-500">Manage your payout preferences and profile.</p>
      </div>

      {/* Payout preferences */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Payout preferences</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-800">Instant payouts</p>
            <p className="text-xs text-zinc-400">
              Get paid immediately for a 5% fee. Standard payouts (free) arrive every Friday.
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profile.instant_payout_enabled ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  profile.instant_payout_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </form>
        </div>

        {!profile.stripe_connect_account_id && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Complete Stripe Connect setup to enable payouts.{' '}
            <Link href="/app/cleaner/connect-onboarding" className="font-medium underline">
              Set up payouts →
            </Link>
          </p>
        )}
      </section>

      {/* Bio */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Profile bio</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Your bio appears on your public profile page and is visible to potential customers.
        </p>
        <BioEditForm currentBio={profile.bio} />
      </section>

      {/* Links */}
      <section className="flex gap-3">
        <Link
          href="/app/cleaner/earnings"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          View earnings
        </Link>
        <Link
          href="/app/cleaner/availability"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Availability
        </Link>
        <Link
          href="/app/cleaner/connect-onboarding"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Stripe Connect
        </Link>
      </section>
    </div>
  );
}
