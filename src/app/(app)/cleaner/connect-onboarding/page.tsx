import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const STEPS = [
  {
    step: '1',
    title: 'Create your Stripe account',
    desc: 'PureTask uses Stripe to process payments. You will create a free Stripe Express account to receive payouts.',
  },
  {
    step: '2',
    title: 'Verify your bank details',
    desc: 'Link the bank account where you want to receive your earnings.',
  },
  {
    step: '3',
    title: 'Confirm your identity',
    desc: 'Stripe may ask for your date of birth and last 4 digits of your SSN to comply with financial regulations.',
  },
  {
    step: '4',
    title: 'Start getting paid',
    desc: 'Once set up, payouts happen every Friday (or instantly for a 5% fee).',
  },
];

const ConnectOnboardingPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarding_completed_at')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/cleaner/apply');

  const isConnected = !!profile.stripe_connect_onboarding_completed_at;
  const hasAccount = !!profile.stripe_connect_account_id;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/cleaner/apply" className="text-sm text-brand-600 hover:underline">
          ← Back to application
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Set Up Payouts</h1>
        <p className="mt-1 text-neutral-500">
          Connect your bank account through Stripe to receive earnings from your cleanings.
        </p>
      </div>

      {isConnected ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-900">Stripe account connected</p>
              <p className="text-sm text-green-700">
                Your payout account is set up and ready. Earnings will be deposited every Friday.
              </p>
            </div>
          </div>
          <Link
            href="/app/cleaner/settings"
            className="mt-4 inline-block rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
          >
            Manage payout preferences →
          </Link>
        </div>
      ) : hasAccount ? (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-900">Setup incomplete</p>
              <p className="text-sm text-yellow-700">
                Your Stripe account was created but setup is not finished. Continue where you left
                off.
              </p>
            </div>
          </div>
          <Link
            href="/cleaner/apply/step-7"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Continue setup →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="text-sm text-neutral-600">
            You have not connected a payout account yet. This is required before you can accept
            bookings.
          </p>
          <Link
            href="/cleaner/apply/step-7"
            className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Connect with Stripe →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-4 font-semibold text-neutral-900">How it works</h2>
        <div className="space-y-4">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">
          Payouts are powered by Stripe Connect. Standard payouts arrive every Friday at no cost.
          Instant payouts (within 30 minutes) are available for a 5% fee after your first completed
          booking.
        </p>
      </div>
    </div>
  );
};

export default ConnectOnboardingPage;
