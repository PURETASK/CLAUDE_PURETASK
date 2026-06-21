import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type BGState = Database['public']['Enums']['background_check_state'];

type Tone = 'info' | 'warning' | 'success' | 'error' | 'neutral';
const TONE: Record<Tone, string> = {
  info: 'border-brand-200 bg-brand-50 text-brand-700',
  warning: 'border-warning/30 bg-warning-light text-warning-dark',
  success: 'border-success/30 bg-success-light text-success-dark',
  error: 'border-error/30 bg-error-light text-error-dark',
  neutral: 'border-neutral-200 bg-neutral-50 text-neutral-700',
};

const STATE_CONFIG: Record<BGState, { label: string; tone: Tone; desc: string }> = {
  requested: {
    label: 'Requested',
    tone: 'info',
    desc: 'Your background check has been requested. You will receive an email from Checkr with next steps.',
  },
  pending: {
    label: 'Pending',
    tone: 'warning',
    desc: 'Your check is queued. Checkr typically processes checks within 1–3 business days.',
  },
  in_progress: {
    label: 'In progress',
    tone: 'info',
    desc: 'Your background check is currently being processed by Checkr.',
  },
  clear: {
    label: 'Clear',
    tone: 'success',
    desc: 'Your background check came back clear. You are approved to work on PureTask.',
  },
  consider: {
    label: 'Under review',
    tone: 'warning',
    desc: 'Your check returned results that require manual review by our team. We will contact you within 2–3 business days.',
  },
  failed: {
    label: 'Not approved',
    tone: 'error',
    desc: 'Your background check did not meet PureTask requirements. Check your email for details and next steps.',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    desc: 'This background check was cancelled. Please contact support if you believe this is an error.',
  },
  expired: {
    label: 'Expired',
    tone: 'warning',
    desc: 'Your background check has expired. A renewal is required to continue working on PureTask.',
  },
};

const WHAT_WE_CHECK = [
  'National criminal database search',
  'County criminal records (7 years)',
  'Sex offender registry',
  'Global watchlist screening',
  'Social Security number trace',
];

const BackgroundCheckPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: check } = await supabase
    .from('background_checks')
    .select('id, state, requested_at, completed_at, result_summary')
    .eq('subject_user_id', user.id)
    .is('replaced_at', null)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = check ? STATE_CONFIG[check.state] : null;

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
          <h1 className="text-lg font-semibold text-neutral-900">Background check</h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          All PureTask cleaners must pass a background check before accepting jobs.
        </p>
      </div>

      {check && config ? (
        <div className={`rounded-2xl border p-5 ${TONE[config.tone]}`}>
          <p className="font-semibold">{config.label}</p>
          {check.requested_at && (
            <p className="mt-0.5 text-xs opacity-70">
              Requested {new Date(check.requested_at).toLocaleDateString()}
              {check.completed_at &&
                ` · Completed ${new Date(check.completed_at).toLocaleDateString()}`}
            </p>
          )}
          <p className="mt-3 text-sm">{config.desc}</p>
        </div>
      ) : (
        <Card elevation={1} className="border border-neutral-200 p-5">
          <p className="text-sm text-neutral-600">
            No background check on file. Your check is initiated as part of the application process.
          </p>
          <Link
            href="/cleaner/apply/step-6"
            className="mt-3 inline-block rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Go to application step
          </Link>
        </Card>
      )}

      <Card elevation={1} className="border border-neutral-200 p-5">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">What we check</h2>
        <ul className="space-y-2">
          {WHAT_WE_CHECK.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-neutral-600">
              <Check className="h-4 w-4 flex-shrink-0 text-brand-600" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">
          Background checks are conducted by Checkr, Inc. You have rights under the Fair Credit
          Reporting Act (FCRA). If your application is affected by a background check result, you
          will receive a pre-adverse action notice.
        </p>
      </Card>
    </div>
  );
};

export default BackgroundCheckPage;
