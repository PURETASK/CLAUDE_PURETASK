'use client';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/** Ambient floating bubbles for marketing — no full app lens. */
export const MarketingBubbleHero = ({ children }: Props) => (
  <section className="marketing-bubble-hero relative overflow-hidden bg-gradient-hero px-6 py-24 text-center text-white">
    <div className="marketing-bubble-hero__ambient" aria-hidden>
      <span className="marketing-bubble-hero__orb marketing-bubble-hero__orb--1" />
      <span className="marketing-bubble-hero__orb marketing-bubble-hero__orb--2" />
      <span className="marketing-bubble-hero__orb marketing-bubble-hero__orb--3" />
      <span className="marketing-bubble-hero__orb marketing-bubble-hero__orb--4" />
    </div>
    <div className="relative z-10 mx-auto max-w-3xl">{children}</div>
  </section>
);
