import { Badge } from '@/components/ui/badge';

type Props = {
  title: string;
  description: string;
  phaseBadge: string;
};

export const StubCard = ({ title, description, phaseBadge }: Props) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <Badge variant="neutral">{phaseBadge}</Badge>
      </div>
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  );
};
