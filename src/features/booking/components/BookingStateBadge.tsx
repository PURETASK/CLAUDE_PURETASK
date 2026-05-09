import { Badge, type BadgeVariant } from '@/components/ui/badge';

const STATE_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  booking_requested: { label: 'Requested', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  imminent: { label: 'Imminent', variant: 'success' },
  in_transit: { label: 'En route', variant: 'warning' },
  arrived: { label: 'Arrived', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'neutral' },
  awaiting_approval: { label: 'Awaiting approval', variant: 'neutral' },
  approved: { label: 'Approved', variant: 'success' },
  auto_approved: { label: 'Auto-approved', variant: 'success' },
  paid: { label: 'Paid', variant: 'success' },
  cleaner_declined: { label: 'Declined', variant: 'error' },
  cancelled_by_customer: { label: 'Cancelled', variant: 'neutral' },
  cancelled_by_cleaner: { label: 'Cancelled', variant: 'neutral' },
  admin_cancelled: { label: 'Admin cancelled', variant: 'neutral' },
  charge_failed: { label: 'Payment failed', variant: 'error' },
  disputed: { label: 'Disputed', variant: 'error' },
};

const FALLBACK: { label: string; variant: BadgeVariant } = { label: 'Unknown', variant: 'neutral' };

type Props = { state: string };

export const BookingStateBadge = ({ state }: Props) => {
  const { label, variant } = STATE_CONFIG[state] ?? FALLBACK;
  return <Badge variant={variant}>{label}</Badge>;
};
