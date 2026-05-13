import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ICONS } from '@/lib/assets';

const SETTINGS_LINKS = [
  {
    href: '/cleaner/settings/insurance',
    icon: ICONS.checkmark,
    title: 'Insurance Verification',
    desc: 'Upload and manage your liability insurance documents.',
  },
  {
    href: '/cleaner/tax-info',
    icon: ICONS.wallet,
    title: 'Tax Information',
    desc: 'SSN / EIN on file for 1099-NEC reporting.',
  },
  {
    href: '/cleaner/verify-identity',
    icon: ICONS.contacts,
    title: 'Identity Verification',
    desc: 'Government-issued ID verification via Stripe Identity.',
  },
  {
    href: '/cleaner/background-check',
    icon: ICONS.checkmark,
    title: 'Background Check',
    desc: 'View the status of your Checkr background check.',
  },
  {
    href: '/cleaner/connect-onboarding',
    icon: ICONS.wallet,
    title: 'Payout Account',
    desc: 'Stripe Connect bank account for receiving earnings.',
  },
];

const CleanerOnboardingSettingsPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/app/cleaner" className="text-sm text-brand-600 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Cleaner Settings</h1>
        <p className="mt-1 text-neutral-500">
          Manage your verification documents, tax info, and payout account.
        </p>
      </div>

      <div className="space-y-3">
        {SETTINGS_LINKS.map(({ href, icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 transition-all hover:border-brand-200 hover:shadow-tier2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
              <Image src={icon} alt="" width={22} height={22} className="object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{title}</p>
              <p className="text-sm text-neutral-500">{desc}</p>
            </div>
            <svg
              className="h-4 w-4 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      <div className="border-t border-neutral-200 pt-4">
        <Link
          href="/app/cleaner/settings"
          className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 transition-all hover:border-brand-200 hover:shadow-tier2"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <Image src={ICONS.settings} alt="" width={22} height={22} className="object-contain" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-neutral-900">Profile &amp; Payout Preferences</p>
            <p className="text-sm text-neutral-500">
              Edit your bio, instant payout toggle, and Stripe Connect link.
            </p>
          </div>
          <svg
            className="h-4 w-4 text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default CleanerOnboardingSettingsPage;
