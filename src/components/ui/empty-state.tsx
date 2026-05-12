import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/lib/assets';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
  showDash?: boolean;
}

export const EmptyState = ({ icon, title, description, action, showDash }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
    {showDash ? (
      <Image src={BRAND.dash} alt="Dash" width={72} height={72} className="mb-2 opacity-85" />
    ) : (
      icon && <div className="mb-2 text-4xl">{icon}</div>
    )}
    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
    <p className="max-w-xs text-sm text-neutral-500">{description}</p>
    {action && (
      <Link
        href={action.href}
        className="mt-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
      >
        {action.label}
      </Link>
    )}
  </div>
);
