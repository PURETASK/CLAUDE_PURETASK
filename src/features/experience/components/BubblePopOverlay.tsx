'use client';

import { useBubbleExperience } from '@/features/experience/bubble-experience-context';

const DROPLETS = [
  { dx: '-80px', dy: '-60px', delay: 0 },
  { dx: '90px', dy: '-40px', delay: 20 },
  { dx: '-40px', dy: '70px', delay: 40 },
  { dx: '70px', dy: '55px', delay: 10 },
  { dx: '0px', dy: '-90px', delay: 30 },
  { dx: '-100px', dy: '20px', delay: 50 },
];

export const BubblePopOverlay = () => {
  const { phase } = useBubbleExperience();

  if (phase !== 'popping') return null;

  return (
    <div className="bubble-pop-overlay" aria-hidden>
      <div className="bubble-pop-overlay__burst" />
      {DROPLETS.map((d, i) => (
        <span
          key={i}
          className="bubble-pop-overlay__droplet"
          style={
            {
              '--dx': d.dx,
              '--dy': d.dy,
              animationDelay: `${d.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
