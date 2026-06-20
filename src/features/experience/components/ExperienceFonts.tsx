import { DM_Sans, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const ExperienceFonts = ({ children }: { children: ReactNode }) => (
  <div className={`${outfit.variable} ${dmSans.variable} h-full`}>{children}</div>
);
