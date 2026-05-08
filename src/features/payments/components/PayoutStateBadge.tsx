type Props = { state: string };

const STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
  in_transit: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Transit' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  cancelled: { bg: 'bg-zinc-100', text: 'text-zinc-600', label: 'Cancelled' },
};

export const PayoutStateBadge = ({ state }: Props) => {
  const s = STYLES[state] ?? STYLES['pending']!;
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};
