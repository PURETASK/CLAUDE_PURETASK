import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type IDState = Database['public']['Enums']['identity_verification_state'];

const STATE_CONFIG: Record<IDState, { label: string; icon: string; color: string; desc: string }> =
  {
    created: {
      label: 'Session Created',
      icon: '🔗',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      desc: 'Your verification session has been created. Follow the link sent to your email to complete verification.',
    },
    requires_input: {
      label: 'Action Required',
      icon: '⚠️',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      desc: 'Additional input is needed to complete your verification. Check your email for instructions.',
    },
    processing: {
      label: 'Processing',
      icon: '🔄',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      desc: 'Your documents are being reviewed. This usually takes a few minutes.',
    },
    verified: {
      label: 'Verified',
      icon: '✅',
      color: 'bg-green-50 border-green-200 text-green-800',
      desc: 'Your identity has been successfully verified. You are cleared to work on PureTask.',
    },
    requires_action: {
      label: 'Manual Review',
      icon: '👀',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      desc: 'Your verification requires manual review by our team. We will contact you within 1–2 business days.',
    },
    failed: {
      label: 'Verification Failed',
      icon: '❌',
      color: 'bg-red-50 border-red-200 text-red-800',
      desc: 'We were unable to verify your identity. Check your email for details on next steps.',
    },
    cancelled: {
      label: 'Cancelled',
      icon: '⛔',
      color: 'bg-neutral-50 border-neutral-200 text-neutral-700',
      desc: 'This verification session was cancelled. You can start a new session from your application.',
    },
  };

const WHAT_YOU_NEED = [
  "Government-issued photo ID (passport, driver's license, or state ID)",
  'A device with a working camera',
  'Good lighting for document and selfie photos',
];

const VerifyIdentityPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: verification } = await supabase
    .from('identity_verifications')
    .select('id, state, submitted_at, verified_at, failure_reason, attempt_number')
    .eq('subject_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = verification ? STATE_CONFIG[verification.state] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <Link href="/cleaner/apply" className="text-sm text-brand-600 hover:underline">
          ← Back to application
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Identity Verification</h1>
        <p className="mt-1 text-neutral-500">
          PureTask uses Stripe Identity to securely verify your government-issued ID.
        </p>
      </div>

      {verification && config ? (
        <div className={`rounded-2xl border p-5 ${config.color}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="font-semibold">{config.label}</p>
              {verification.submitted_at && (
                <p className="text-xs opacity-70">
                  Submitted {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              )}
              {verification.verified_at && (
                <p className="text-xs opacity-70">
                  Verified {new Date(verification.verified_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm">{config.desc}</p>
          {verification.failure_reason && (
            <p className="mt-2 text-xs opacity-80">Reason: {verification.failure_reason}</p>
          )}
          {(verification.state === 'failed' || verification.state === 'cancelled') && (
            <Link
              href="/cleaner/apply/step-5"
              className="mt-3 inline-block rounded-lg bg-white/60 px-4 py-2 text-sm font-medium hover:bg-white/80"
            >
              Restart verification →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <p className="text-sm text-neutral-600">
            No verification on file. Identity verification is initiated during the application
            process.
          </p>
          <Link
            href="/cleaner/apply/step-5"
            className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Start verification
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
        <h2 className="mb-3 font-semibold text-neutral-900">What you will need</h2>
        <ul className="space-y-2">
          {WHAT_YOU_NEED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className="mt-0.5 text-brand-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">
          Your identity documents are processed by Stripe Identity and are never stored by PureTask.
          Information is used solely to verify your identity and is protected under Stripe&apos;s
          privacy policy.
        </p>
      </div>
    </div>
  );
};

export default VerifyIdentityPage;
