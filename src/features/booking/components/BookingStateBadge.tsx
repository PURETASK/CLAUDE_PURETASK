const STATE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  booking_requested: { label: 'Requested', bg: 'bg-blue-50', text: 'text-blue-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  imminent: { label: 'Imminent', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  in_transit: { label: 'En route', bg: 'bg-amber-50', text: 'text-amber-700' },
  arrived: { label: 'Arrived', bg: 'bg-amber-50', text: 'text-amber-700' },
  in_progress: { label: 'In progress', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { label: 'Completed', bg: 'bg-zinc-100', text: 'text-zinc-700' },
  awaiting_approval: { label: 'Awaiting approval', bg: 'bg-zinc-100', text: 'text-zinc-600' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  auto_approved: { label: 'Auto-approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cleaner_declined: { label: 'Declined', bg: 'bg-red-50', text: 'text-red-600' },
  cancelled_by_customer: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-500' },
  cancelled_by_cleaner: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-500' },
  admin_cancelled: { label: 'Admin cancelled', bg: 'bg-zinc-100', text: 'text-zinc-500' },
  charge_failed: { label: 'Payment failed', bg: 'bg-red-50', text: 'text-red-600' },
  disputed: { label: 'Disputed', bg: 'bg-red-50', text: 'text-red-600' },
};

const FALLBACK = { label: 'Unknown', bg: 'bg-zinc-100', text: 'text-zinc-500' };

type Props = { state: string };

export const BookingStateBadge = ({ state }: Props) => {
  const { label, bg, text } = STATE_CONFIG[state] ?? FALLBACK;
  return (
    <span className={`${bg} ${text} rounded-full px-2.5 py-0.5 text-xs font-medium`}>{label}</span>
  );
};
