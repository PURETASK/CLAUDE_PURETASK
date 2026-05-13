import Link from 'next/link';

interface AttentionItem {
  id: string;
  label: string;
  href: string;
  severity: 'critical' | 'warning';
  count: number;
}

interface Props {
  items: AttentionItem[];
}

export const NeedsAttention = ({ items }: Props) => {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-light p-5 text-center">
        <p className="font-medium text-success-dark">
          All clear — nothing needs attention right now.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
      <h2 className="mb-4 font-semibold text-neutral-900">Needs Attention</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-neutral-50 ${
              item.severity === 'critical'
                ? 'border-error/30 bg-error/5'
                : 'border-warning/30 bg-warning/5'
            }`}
          >
            <span
              className={`text-sm font-medium ${item.severity === 'critical' ? 'text-error' : 'text-warning-dark'}`}
            >
              {item.label}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                item.severity === 'critical' ? 'bg-error text-white' : 'bg-warning text-white'
              }`}
            >
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
