'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { unlockAudio } from '@/lib/sound/sound-manager';

type Props = {
  href: string;
  children: React.ReactNode;
};

export const BubbleNavLink = ({ href, children }: Props) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={() => unlockAudio()}
      aria-current={isActive ? 'page' : undefined}
      className={`bubble-nav-link ${isActive ? 'bubble-nav-link--active' : ''}`}
    >
      {children}
    </Link>
  );
};
