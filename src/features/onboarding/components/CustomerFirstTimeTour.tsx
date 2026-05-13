'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';

import { completeMilestone } from '@/features/onboarding/actions/milestone-actions';
import { ICONS } from '@/lib/assets';

const SLIDES = [
  {
    icon: ICONS.checkmark,
    title: 'Every cleaner is verified',
    body: 'Background checked, ID verified, and reviewed before their first job.',
    bg: 'bg-brand-50',
    iconBg: 'bg-brand-100',
  },
  {
    icon: ICONS.cleaning,
    title: 'Photo proof of every job',
    body: 'Before & after photos for every room, automatically sent when the job is done.',
    bg: 'bg-brand-50',
    iconBg: 'bg-brand-100',
  },
  {
    icon: ICONS.wallet,
    title: 'Pay only when you approve',
    body: 'Your payment is held until you say yes. Review photos, then release.',
    bg: 'bg-success-light',
    iconBg: 'bg-white/80',
  },
] as const;

interface Props {
  onDone: () => void;
}

export const CustomerFirstTimeTour = ({ onDone }: Props) => {
  const [slide, setSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide]!;

  const handleNext = () => {
    if (isLast) {
      startTransition(async () => {
        await completeMilestone('customer_tour');
        onDone();
      });
    } else {
      setSlide((s) => s + 1);
    }
  };

  const handleSkip = () => {
    startTransition(async () => {
      await completeMilestone('customer_tour');
      onDone();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-4 sm:items-center">
      <div
        className={`w-full max-w-sm rounded-3xl border border-neutral-200 p-8 shadow-tier3 ${current.bg}`}
      >
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${current.iconBg}`}
        >
          <Image src={current.icon} alt="" width={40} height={40} className="object-contain" />
        </div>

        <h2 className="text-center text-xl font-bold text-neutral-900">{current.title}</h2>
        <p className="mt-2 text-center text-sm text-neutral-600">{current.body}</p>

        <div className="mt-6 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === slide ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleNext}
            disabled={isPending}
            className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
          {!isLast && (
            <button
              onClick={handleSkip}
              disabled={isPending}
              className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
