import {
  Award,
  Briefcase,
  Calendar,
  CalendarClock,
  Heart,
  Home,
  Inbox,
  LifeBuoy,
  Repeat,
  Search,
  User,
  Wallet,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  /** When true, only an exact pathname match counts as active (used for role roots). */
  exact?: boolean;
};

export type RoleNav = {
  /** Shown in the mobile bottom tab bar + top of the desktop sidebar. */
  primary: NavItem[];
  /** Sidebar + mobile drawer only (overflow nav). */
  secondary: NavItem[];
};

const CUSTOMER: RoleNav = {
  primary: [
    { label: 'Home', href: '/app/dashboard', icon: Home, exact: true },
    { label: 'Browse', href: '/app/cleaners', icon: Search },
    { label: 'Inbox', href: '/app/notifications', icon: Inbox },
    { label: 'Profile', href: '/app/settings', icon: User },
  ],
  secondary: [
    { label: 'My Bookings', href: '/app/bookings', icon: Calendar },
    { label: 'Recurring', href: '/app/recurring', icon: Repeat },
    { label: 'Favorites', href: '/app/favorites', icon: Heart },
    { label: 'Support', href: '/app/support', icon: LifeBuoy },
  ],
};

const CLEANER: RoleNav = {
  primary: [
    { label: 'Home', href: '/app/cleaner', icon: Home, exact: true },
    { label: 'Jobs', href: '/app/cleaner/bookings', icon: Briefcase },
    { label: 'Earnings', href: '/app/cleaner/earnings', icon: Wallet },
    { label: 'Profile', href: '/app/settings', icon: User },
  ],
  secondary: [
    { label: 'Availability', href: '/app/cleaner/availability', icon: CalendarClock },
    { label: 'My Score', href: '/app/cleaner/score', icon: Award },
    { label: 'Support', href: '/app/support', icon: LifeBuoy },
  ],
};

export const getNav = (role: string): RoleNav => (role === 'cleaner' ? CLEANER : CUSTOMER);

/** Active when the path equals the href, or (for non-exact items) is nested under it. */
export const isActiveHref = (pathname: string, item: NavItem): boolean =>
  item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
