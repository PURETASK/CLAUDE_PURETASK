'use client';

import { useState, useTransition } from 'react';

import {
  BubbleTourOverlay,
  BubbleTourSlide,
} from '@/features/experience/components/BubbleTourOverlay';
import { completeMilestone } from '@/features/onboarding/actions/milestone-actions';
import { ICONS } from '@/lib/assets';

const SLIDES = [
  {
    icon: ICONS.home,
    title: 'Your dashboard & score',
    body: 'Your reliability score (0–100) determines your tier and platform fee. Higher score = lower fee + more bookings.',
  },
  {
    icon: ICONS.calendar,
    title: 'How job requests work',
    body: 'When a customer books you, you have 4 hours to accept or decline. Accept fast — top cleaners respond in under 20 minutes.',
  },
  {
    icon: ICONS.cleaning,
    title: 'The photo system',
    body: 'Upload before & after photos for each room. Photos protect you in disputes and improve your photo compliance score.',
  },
  {
    icon: ICONS.wallet,
    title: 'Earnings & payouts',
    body: 'Customers approve your work and release payment. Funds hit your bank in 1–2 business days via Stripe.',
  },
  {
    icon: ICONS.cleaning2,
    title: 'Tiers & your intro rate',
    body: 'Your first 6 months: 12% platform fee. Reach Proven Specialist (score 70+) to drop to 13%, Top Performer for 11%.',
  },
] as const;

interface Props {
  onDone: () => void;
}

export const CleanerPlatformTour = ({ onDone }: Props) => {
  const [slide, setSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide]!;

  const handleNext = () => {
    if (isLast) {
      startTransition(async () => {
        await completeMilestone('cleaner_tour');
        onDone();
      });
    } else {
      setSlide((s) => s + 1);
    }
  };

  return (
    <BubbleTourOverlay open panelClassName="p-0 overflow-hidden">
      <BubbleTourSlide icon={current.icon} title={current.title} body={current.body} />

      <div className="bg-white px-8 pb-8">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-brand-600">
          {slide + 1} of {SLIDES.length}
        </p>

        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === slide ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="mt-6 w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {isLast ? 'Start earning' : 'Next'}
        </button>
      </div>
    </BubbleTourOverlay>
  );
};
