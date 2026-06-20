'use client';

import Image from 'next/image';

import { BRAND } from '@/lib/assets';

/** Dash mascot peeking from the bubble lens rim. */
export const BubbleLensMascot = () => (
  <div className="bubble-lens-mascot" aria-hidden>
    <Image
      src={BRAND.dashMascot}
      alt=""
      width={72}
      height={72}
      className="bubble-lens-mascot__img"
      priority={false}
    />
  </div>
);
