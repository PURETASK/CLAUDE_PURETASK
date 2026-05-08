const STATE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: 'Open', bg: 'bg-amber-50', text: 'text-amber-700' },
  cleaner_responded: { label: 'Cleaner responded', bg: 'bg-blue-50', text: 'text-blue-700' },
  awaiting_customer: { label: 'Awaiting you', bg: 'bg-blue-50', text: 'text-blue-700' },
  mutually_resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  escalated: { label: 'Escalated', bg: 'bg-red-50', text: 'text-red-600' },
  in_mediation: { label: 'In mediation', bg: 'bg-red-50', text: 'text-red-600' },
  admin_resolved: { label: 'Admin resolved', bg: 'bg-zinc-100', text: 'text-zinc-600' },
  expired: { label: 'Expired', bg: 'bg-zinc-100', text: 'text-zinc-500' },
};

const FALLBACK = { label: 'Unknown', bg: 'bg-zinc-100', text: 'text-zinc-500' };

type Props = { state: string };

export const DisputeStateBadge = ({ state }: Props) => {
  const { label, bg, text } = STATE_CONFIG[state] ?? FALLBACK;
  return (
    <span className={`${bg} ${text} rounded-full px-2.5 py-0.5 text-xs font-medium`}>{label}</span>
  );
};
