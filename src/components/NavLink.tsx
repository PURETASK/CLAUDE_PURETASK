'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`text-sm font-medium transition-colors duration-150 ${
        isActive
          ? 'text-brand-600 underline underline-offset-4 decoration-brand-600/40'
          : 'text-neutral-600 hover:text-brand-600'
      }`}
    >
      {children}
    </Link>
  );
}
