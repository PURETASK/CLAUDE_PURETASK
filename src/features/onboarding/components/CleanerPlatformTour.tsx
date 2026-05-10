'use client';

import { useState, useTransition } from 'react';

import { completeMilestone } from '@/features/onboarding/actions/milestone-actions';

const SLIDES = [
  {
    icon: '📊',
    title: 'Your dashboard & score',
    body: 'Your reliability score (0–100) determines your tier and platform fee. Higher score = lower fee + more bookings.',
  },
  {
    icon: '📬',
    title: 'How job requests work',
    body: 'When a customer books you, you have 4 hours to accept or decline. Accept fast — top cleaners respond in under 20 minutes.',
  },
  {
    icon: '📸',
    title: 'The photo system',
    body: 'Upload before & after photos for each room. Photos protect you in disputes and improve your photo compliance score.',
  },
  {
    icon: '💰',
    title: 'Earnings & payouts',
    body: 'Customers approve your work and release payment. Funds hit your bank in 1–2 business days via Stripe.',
  },
  {
    icon: '⭐',
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-tier3">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-600/10 text-3xl">
          {current.icon}
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand-600">
          {slide + 1} of {SLIDES.length}
        </p>
        <h2 className="mt-1 text-center text-xl font-bold text-neutral-900">{current.title}</h2>
        <p className="mt-2 text-center text-sm text-neutral-600">{current.body}</p>

        <div className="mt-6 flex justify-center gap-2">
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
          onClick={handleNext}
          disabled={isPending}
          className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isLast ? 'Start earning' : 'Next'}
        </button>
      </div>
    </div>
  );
};
