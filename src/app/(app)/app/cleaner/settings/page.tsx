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
        <Link
          href="/app/cleaner"
          className="mb-1 block text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Cleaner settings</h1>
        <p className="text-sm text-neutral-500">Manage your payout preferences and profile.</p>
      </div>

      {/* Payout preferences */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Payout preferences</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-800">Instant payouts</p>
            <p className="text-xs text-neutral-400">
              Get paid immediately for a 5% fee. Standard payouts (free) arrive every Friday.
            </p>
          </div>
          <form action={toggleAction}>
            <button
              type="submit"
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                profile.instant_payout_enabled ? 'bg-brand-600' : 'bg-neutral-200'
              }`}
              aria-checked={profile.instant_payout_enabled}
              role="switch"
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
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            Complete Stripe Connect setup to enable payouts.{' '}
            <Link href="/cleaner/connect-onboarding" className="font-semibold underline">
              Set up payouts →
            </Link>
          </p>
        )}
      </section>

      {/* Bio */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Profile bio</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Your bio appears on your public profile page and is visible to potential customers.
        </p>
        <BioEditForm currentBio={profile.bio} />
      </section>

      {/* Verification & taxes */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">Verification &amp; taxes</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Keep your trust badges and payout paperwork up to date.
        </p>
        <div className="flex flex-col divide-y divide-neutral-100">
          {[
            {
              href: '/cleaner/settings/insurance',
              label: 'Insurance verification',
              desc: 'Upload a policy to earn the Insurance Verified badge.',
            },
            {
              href: '/cleaner/background-check',
              label: 'Background check status',
              desc: 'Track your Checkr screening.',
            },
            {
              href: '/cleaner/settings/tax',
              label: 'Tax information',
              desc: 'W-9 details for your 1099.',
            },
          ].map((row) => (
            <Link
              key={row.href}
              href={row.href}
              className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand-600"
            >
              <span>
                <span className="block text-sm font-medium text-neutral-800">{row.label}</span>
                <span className="block text-xs text-neutral-400">{row.desc}</span>
              </span>
              <span aria-hidden className="text-neutral-300">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/app/cleaner/earnings"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          View earnings
        </Link>
        <Link
          href="/app/cleaner/availability"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Availability
        </Link>
        <Link
          href="/app/cleaner/score"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Reliability score
        </Link>
        <Link
          href="/cleaner/connect-onboarding"
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-tier1 transition-all hover:bg-neutral-50"
        >
          Stripe Connect
        </Link>
      </section>
    </div>
  );
}
