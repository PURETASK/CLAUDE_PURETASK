import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
    {icon && <div className="mb-2 text-4xl">{icon}</div>}
    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
    <p className="max-w-xs text-sm text-neutral-500">{description}</p>
    {action && (
      <Link
        href={action.href}
        className="mt-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {action.label}
      </Link>
    )}
  </div>
);
