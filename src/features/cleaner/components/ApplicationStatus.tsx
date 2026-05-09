import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    desc: 'Congratulations! Your application has been approved. Complete the steps below to start taking bookings.',
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
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-neutral-900">Next steps</h2>
          <PlaceholderCard
            title="Identity verification"
            desc="Verify your government-issued ID via Stripe Identity."
            badge="Coming soon"
          />
          <PlaceholderCard
            title="Background check"
            desc="We'll initiate a Checkr background check once identity is verified."
            badge="Coming soon"
          />
          <PlaceholderCard
            title="Payout setup"
            desc="Connect your bank account to receive payments via Stripe Connect."
            badge="Coming soon"
          />
        </div>
      )}

      {submittedAt && (
        <p className="text-xs text-neutral-400">
          Submitted {new Date(submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
        </p>
      )}
    </div>
  );
};

const PlaceholderCard = ({
  title,
  desc,
  badge,
}: {
  title: string;
  desc: string;
  badge: string;
}) => (
  <Card className="flex items-start justify-between gap-4 p-4">
    <div>
      <p className="text-sm font-semibold text-neutral-800">{title}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{desc}</p>
    </div>
    <Badge variant="neutral" className="shrink-0">
      {badge}
    </Badge>
  </Card>
);
