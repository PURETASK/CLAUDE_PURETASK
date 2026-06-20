'use client';

import type { ReactNode } from 'react';

import { useBubbleExperience } from '@/features/experience/bubble-experience-context';

import { BubbleLensMascot } from './BubbleLensMascot';
import { BubblePopOverlay } from './BubblePopOverlay';
import { BubbleRimDecor } from './BubbleRimDecor';

type Props = {
  children: ReactNode;
};

export const BubbleViewport = ({ children }: Props) => {
  const { phase, contentVisible } = useBubbleExperience();

  const lensClass = [
    'bubble-lens',
    phase === 'popping' ? 'bubble-lens--popping' : '',
    phase === 'entering' ? 'bubble-lens--entering' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentClass = [
    'bubble-lens__content',
    !contentVisible ? 'bubble-lens__content--hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className="bubble-scene__ambient" aria-hidden>
        <span className="bubble-scene__orb bubble-scene__orb--1" />
        <span className="bubble-scene__orb bubble-scene__orb--2" />
        <span className="bubble-scene__orb bubble-scene__orb--3" />
      </div>

      <div className="bubble-lens-wrap">
        <div className={lensClass}>
          <BubbleRimDecor />
          <BubbleLensMascot />
          <div className={contentClass}>{children}</div>
        </div>
      </div>

      <BubblePopOverlay />
    </>
  );
};
