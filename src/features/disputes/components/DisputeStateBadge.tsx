import { Badge, type BadgeVariant } from '@/components/ui/badge';

const STATE_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  open: { label: 'Open', variant: 'warning' },
  cleaner_responded: { label: 'Cleaner responded', variant: 'info' },
  awaiting_customer: { label: 'Awaiting you', variant: 'info' },
  mutually_resolved: { label: 'Resolved', variant: 'success' },
  escalated: { label: 'Escalated', variant: 'error' },
  in_mediation: { label: 'In mediation', variant: 'error' },
  admin_resolved: { label: 'Admin resolved', variant: 'neutral' },
  expired: { label: 'Expired', variant: 'neutral' },
};

const FALLBACK: { label: string; variant: BadgeVariant } = { label: 'Unknown', variant: 'neutral' };

type Props = { state: string };

export const DisputeStateBadge = ({ state }: Props) => {
  const { label, variant } = STATE_CONFIG[state] ?? FALLBACK;
  return <Badge variant={variant}>{label}</Badge>;
};
