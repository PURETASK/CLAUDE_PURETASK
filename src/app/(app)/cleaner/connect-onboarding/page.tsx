import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/cleaner/settings"
            className="flex-shrink-0 text-neutral-500 transition-colors hover:text-neutral-900"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Set up payouts</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Connect your bank account through Stripe to receive earnings from your cleanings.
        </p>
      </div>

      {isConnected ? (
        <div className="rounded-2xl border border-success/30 bg-success-light p-5">
          <p className="font-semibold text-success-dark">Stripe account connected</p>
          <p className="mt-1 text-sm text-success-dark/80">
            Your payout account is set up and ready. Earnings will be deposited every Friday.
          </p>
          <Link
            href="/app/cleaner/settings"
            className="mt-4 inline-block rounded-lg border border-success/30 bg-white px-4 py-2 text-sm font-medium text-success-dark hover:bg-success-light"
          >
            Manage payout preferences →
          </Link>
        </div>
      ) : hasAccount ? (
        <div className="rounded-2xl border border-warning/30 bg-warning-light p-5">
          <p className="font-semibold text-warning-dark">Setup incomplete</p>
          <p className="mt-1 text-sm text-warning-dark/80">
            Your Stripe account was created but setup isn&apos;t finished. Continue where you left
            off.
          </p>
          <Link
            href="/cleaner/apply/step-7"
            className="mt-4 inline-block rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Continue setup →
          </Link>
        </div>
      ) : (
        <Card elevation={1} className="border border-neutral-200 p-5">
          <p className="text-sm text-neutral-600">
            You haven&apos;t connected a payout account yet. This is required before you can accept
            bookings.
          </p>
          <Link
            href="/cleaner/apply/step-7"
            className="mt-3 inline-block rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Connect with Stripe →
          </Link>
        </Card>
      )}

      <Card elevation={1} className="border border-neutral-200 p-5">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">How it works</h2>
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
      </Card>

      <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">
          Payouts are powered by Stripe Connect. Standard payouts arrive every Friday at no cost.
          Instant payouts (within 30 minutes) are available for a 5% fee after your first completed
          booking.
        </p>
      </Card>
    </div>
  );
};

export default ConnectOnboardingPage;
