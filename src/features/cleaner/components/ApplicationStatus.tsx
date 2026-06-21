import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { TrustCallout } from '@/components/ui/trust-callout';

const STATE_LABELS: Record<string, { label: string; variant: BadgeVariant; desc: string }> = {
  submitted: {
    label: 'Under review',
    variant: 'warning',
    desc: "Your application has been received. We'll review it and get back to you within 2–3 business days.",
  },
  in_review: {
    label: 'In review',
    variant: 'info',
    desc: 'Our team is currently reviewing your application.',
  },
  needs_info: {
    label: 'Info requested',
    variant: 'warning',
    desc: 'We need a bit more information before we can continue.',
  },
  approved: {
    label: 'Approved',
    variant: 'success',
    desc: 'Congratulations! Your application has been approved. Finish setting up your profile to start taking bookings.',
  },
  rejected: {
    label: 'Not approved',
    variant: 'error',
    desc: "We weren't able to approve your application at this time.",
  },
};

type Props = {
  state: string;
  applicationNumber: string;
  submittedAt: string | null;
  rejectionReason?: string | null;
  infoRequestMessage?: string | null;
};

export const ApplicationStatus = ({
  state,
  applicationNumber,
  submittedAt,
  rejectionReason,
  infoRequestMessage,
}: Props) => {
  const info = STATE_LABELS[state] ?? {
    label: state,
    variant: 'neutral' as BadgeVariant,
    desc: '',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Application status</h1>
          <p className="mt-1 text-sm text-neutral-500">#{applicationNumber}</p>
        </div>
        <Badge variant={info.variant}>{info.label}</Badge>
      </div>

      <p className="text-sm text-neutral-700">{info.desc}</p>

      {state === 'needs_info' && infoRequestMessage && (
        <TrustCallout variant="warning" title="Message from our team:">
          <p>{infoRequestMessage}</p>
          <p className="mt-2 text-neutral-500">
            Please reply to the email we sent to your account address, or contact{' '}
            <span className="font-medium">support@puretask.com</span> with your application number.
          </p>
        </TrustCallout>
      )}

      {state === 'rejected' && rejectionReason && (
        <TrustCallout variant="caution" title="Reason:">
          {rejectionReason}
        </TrustCallout>
      )}

      {state === 'approved' && (
        <Link
          href="/app/cleaner/setup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
        >
          Set up your profile
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      )}

      {submittedAt && (
        <p className="text-xs text-neutral-400">
          Submitted {new Date(submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
        </p>
      )}
    </div>
  );
};
