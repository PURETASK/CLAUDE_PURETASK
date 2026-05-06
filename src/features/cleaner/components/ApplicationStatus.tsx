const STATE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  submitted: {
    label: 'Under review',
    color: 'bg-amber-100 text-amber-800',
    desc: "Your application has been received. We'll review it and get back to you within 2–3 business days.",
  },
  in_review: {
    label: 'In review',
    color: 'bg-blue-100 text-blue-800',
    desc: 'Our team is currently reviewing your application.',
  },
  needs_info: {
    label: 'Info requested',
    color: 'bg-orange-100 text-orange-800',
    desc: 'We need a bit more information before we can continue.',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    desc: 'Congratulations! Your application has been approved. Complete the steps below to start taking bookings.',
  },
  rejected: {
    label: 'Not approved',
    color: 'bg-red-100 text-red-800',
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
    color: 'bg-zinc-100 text-zinc-700',
    desc: '',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Application status</h1>
          <p className="mt-1 text-sm text-zinc-500">#{applicationNumber}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${info.color}`}>
          {info.label}
        </span>
      </div>

      <p className="text-sm">{info.desc}</p>

      {state === 'needs_info' && infoRequestMessage ? (
        <div className="rounded border border-orange-200 bg-orange-50 p-4 text-sm">
          <p className="font-medium text-orange-800">Message from our team:</p>
          <p className="mt-1 text-orange-700">{infoRequestMessage}</p>
          <p className="mt-3 text-zinc-500">
            Please reply to the email we sent to your account address, or contact{' '}
            <span className="font-medium">support@puretask.com</span> with your application number.
          </p>
        </div>
      ) : null}

      {state === 'rejected' && rejectionReason ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-800">Reason:</p>
          <p className="mt-1 text-red-700">{rejectionReason}</p>
        </div>
      ) : null}

      {state === 'approved' ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Next steps</h2>
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
      ) : null}

      {submittedAt ? (
        <p className="text-xs text-zinc-400">
          Submitted {new Date(submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
        </p>
      ) : null}
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
  <div className="flex items-start justify-between gap-4 rounded border p-4">
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>
    </div>
    <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{badge}</span>
  </div>
);
