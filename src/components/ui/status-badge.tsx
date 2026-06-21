import { Badge, type BadgeVariant } from './badge';

/** Maps booking / job / payment statuses to a badge variant + human label. */
const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  pending_acceptance: { variant: 'warning', label: 'Pending' },
  requested: { variant: 'warning', label: 'Requested' },
  accepted: { variant: 'info', label: 'Accepted' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  scheduled: { variant: 'info', label: 'Scheduled' },
  on_my_way: { variant: 'info', label: 'On the way' },
  in_progress: { variant: 'brand', label: 'In progress' },
  awaiting_approval: { variant: 'warning', label: 'Awaiting approval' },
  completed: { variant: 'success', label: 'Completed' },
  approved: { variant: 'success', label: 'Approved' },
  paid: { variant: 'success', label: 'Paid' },
  active: { variant: 'success', label: 'Active' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  canceled: { variant: 'neutral', label: 'Cancelled' },
  declined: { variant: 'error', label: 'Declined' },
  disputed: { variant: 'error', label: 'Disputed' },
  refunded: { variant: 'neutral', label: 'Refunded' },
  expired: { variant: 'neutral', label: 'Expired' },
  paused: { variant: 'neutral', label: 'Paused' },
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const entry = STATUS_MAP[status] ?? {
    variant: 'neutral' as BadgeVariant,
    label: status.replace(/_/g, ' '),
  };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
};
