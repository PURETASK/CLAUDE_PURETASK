'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { playTab, unlockAudio } from '@/lib/sound/sound-manager';

const SETTINGS_TABS = [
  { href: '/app/settings', label: 'Overview', exact: true },
  { href: '/app/settings/profile', label: 'Profile' },
  { href: '/app/settings/addresses', label: 'Addresses' },
  { href: '/app/settings/notifications', label: 'Alerts' },
  { href: '/app/settings/payment-methods', label: 'Payment' },
  { href: '/app/settings/security', label: 'Security' },
  { href: '/app/settings/privacy', label: 'Privacy' },
  { href: '/app/settings/integrations', label: 'Integrations' },
] as const;

const isActive = (pathname: string, href: string, exact?: boolean) => {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

export const SettingsBubbleNav = () => {
  const pathname = usePathname();

  return (
    <nav className="bubble-tabs__list bubble-tabs__list--scroll" aria-label="Settings sections">
      {SETTINGS_TABS.map((tab) => {
        const active = isActive(pathname, tab.href, 'exact' in tab ? tab.exact : false);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`bubble-tabs__trigger ${active ? 'bubble-tabs__trigger--active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (active) return;
              unlockAudio();
              playTab();
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
