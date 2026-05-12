import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type BGState = Database['public']['Enums']['background_check_state'];

const STATE_CONFIG: Record<BGState, { label: string; icon: string; color: string; desc: string }> =
  {
    requested: {
      label: 'Requested',
      icon: '📋',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      desc: 'Your background check has been requested. You will receive an email from Checkr with next steps.',
    },
    pending: {
      label: 'Pending',
      icon: '⏳',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      desc: 'Your check is queued. Checkr typically processes checks within 1–3 business days.',
    },
    in_progress: {
      label: 'In Progress',
      icon: '🔄',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      desc: 'Your background check is currently being processed by Checkr.',
    },
    clear: {
      label: 'Clear',
      icon: '✅',
      color: 'bg-green-50 border-green-200 text-green-800',
      desc: 'Your background check came back clear. You are approved to work on PureTask.',
    },
    consider: {
      label: 'Under Review',
      icon: '👀',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      desc: 'Your check returned results that require manual review by our team. We will contact you within 2–3 business days.',
    },
    failed: {
      label: 'Not Approved',
      icon: '❌',
      color: 'bg-red-50 border-red-200 text-red-800',
      desc: 'Your background check did not meet PureTask requirements. Check your email for details and next steps.',
    },
    cancelled: {
      label: 'Cancelled',
      icon: '⛔',
      color: 'bg-neutral-50 border-neutral-200 text-neutral-700',
      desc: 'This background check was cancelled. Please contact support if you believe this is an error.',
    },
    expired: {
      label: 'Expired',
      icon: '📅',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/cleaner/apply" className="text-sm text-brand-600 hover:underline">
          ← Back to application
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Background Check</h1>
        <p className="mt-1 text-neutral-500">
          All PureTask cleaners must pass a background check before accepting jobs.
        </p>
      </div>

      {check && config ? (
        <div className={`rounded-2xl border p-5 ${config.color}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="font-semibold">{config.label}</p>
              {check.requested_at && (
                <p className="text-xs opacity-70">
                  Requested {new Date(check.requested_at).toLocaleDateString()}
                  {check.completed_at &&
                    ` · Completed ${new Date(check.completed_at).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm">{config.desc}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="text-sm text-neutral-600">
            No background check on file. Your check will be initiated as part of the application
            process.
          </p>
          <Link
            href="/cleaner/apply/step-6"
            className="mt-3 inline-block rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Go to application step
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-3 font-semibold text-neutral-900">What we check</h2>
        <ul className="space-y-2">
          {WHAT_WE_CHECK.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="text-brand-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">
          Background checks are conducted by Checkr, Inc. You have rights under the Fair Credit
          Reporting Act (FCRA). If your application is affected by a background check result, you
          will receive a pre-adverse action notice.
        </p>
      </div>
    </div>
  );
};

export default BackgroundCheckPage;
