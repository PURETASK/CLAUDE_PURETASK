import { Badge, type BadgeVariant } from '@/components/ui/badge';

type Props = { state: string };

const VARIANT_MAP: Record<string, BadgeVariant> = {
  pending: 'warning',
  in_transit: 'info',
  paid: 'success',
  failed: 'error',
  cancelled: 'neutral',
};

const LABEL_MAP: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const PayoutStateBadge = ({ state }: Props) => (
  <Badge variant={VARIANT_MAP[state] ?? 'neutral'}>{LABEL_MAP[state] ?? state}</Badge>
);
