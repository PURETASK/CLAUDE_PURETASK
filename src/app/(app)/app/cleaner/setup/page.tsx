import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { getMyAvailability } from '@/features/cleaner/availability-queries';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils/cn';

const CleanerSetupPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { data: identity }, { data: bg }, availability] = await Promise.all([
    admin
      .from('cleaner_profiles')
      .select('bio, stripe_connect_onboarding_completed_at, current_tier')
      .eq('user_id', user.id)
      .single(),
    admin
      .from('identity_verifications')
      .select('state')
      .eq('subject_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('background_checks')
      .select('state')
      .eq('subject_user_id', user.id)
      .is('replaced_at', null)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getMyAvailability(),
  ]);

  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there';

  const items = [
    {
      title: 'Account created',
      desc: 'Email confirmed and password set.',
      done: true,
      href: '/app/cleaner/settings',
    },
    {
      title: 'Identity verified',
      desc: 'Government ID confirmed via Stripe Identity.',
      done: identity?.state === 'verified',
      href: '/cleaner/verify-identity',
    },
    {
      title: 'Background check passed',
      desc: 'Cleared via Checkr.',
      done: bg?.state === 'clear',
      href: '/cleaner/background-check',
    },
    {
      title: 'Payouts connected',
      desc: 'Link a bank account so you can get paid every Friday.',
      done: !!profile?.stripe_connect_onboarding_completed_at,
      href: '/cleaner/connect-onboarding',
    },
    {
      title: 'Build your profile',
      desc: 'Photo, bio, and what makes you different — this is what customers see.',
      done: !!profile?.bio,
      href: '/app/cleaner/settings',
    },
    {
      title: 'Set rates & availability',
      desc: 'Pick your bookable hours for the next 4 weeks.',
      done: (availability?.rules.length ?? 0) > 0,
      href: '/app/cleaner/availability',
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const allDone = doneCount === items.length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="text-center">
        <span className="inline-block rounded-full bg-success-light px-3 py-1 text-xs font-medium text-success-dark">
          You&apos;re approved
        </span>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">
          Welcome to PureTask, {firstName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          A few last steps and you&apos;re ready to take bookings.
        </p>
      </div>

      <Card elevation={1} className="border border-neutral-200 p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-neutral-900">
            {doneCount} of {items.length} complete
          </p>
          <p className="text-xs text-neutral-400">
            {allDone ? 'All set!' : `${items.length - doneCount} left`}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-gradient-brand transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4 transition-colors',
              item.done
                ? 'border-neutral-200 bg-white'
                : 'border-brand-200 bg-brand-50/40 hover:bg-brand-50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2',
                item.done ? 'border-success bg-success' : 'border-neutral-300',
              )}
            >
              {item.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  item.done ? 'text-neutral-500 line-through' : 'text-neutral-900',
                )}
              >
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">{item.desc}</p>
            </div>
            {!item.done && (
              <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-brand-600" strokeWidth={2} />
            )}
          </Link>
        ))}
      </div>

      <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-sm font-semibold capitalize text-neutral-900">
          Your starting tier: {(profile?.current_tier ?? 'rising pro').replace(/_/g, ' ')}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Intro rate for your first 6 jobs, then your tier is recalculated from your reliability
          score.
        </p>
        <p className="mt-3 border-t border-neutral-100 pt-3 text-sm font-semibold text-neutral-900">
          You&apos;re featured for 30 days
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          New cleaners appear in the spotlight at the top of customer search results. Make the most
          of it.
        </p>
      </Card>

      {allDone && (
        <Link
          href="/app/cleaner"
          className="rounded-xl bg-gradient-brand px-6 py-3 text-center text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Go to dashboard
        </Link>
      )}

      <p className="text-center text-xs text-neutral-400">
        Need help?{' '}
        <Link href="/app/support" className="text-brand-600 hover:text-brand-700">
          Message support
        </Link>
        .
      </p>
    </div>
  );
};

export default CleanerSetupPage;
