'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { BACKGROUNDS, BRAND, ICONS } from '@/lib/assets';

const SLIDES = [
  {
    icon: ICONS.cleaning,
    bg: BACKGROUNDS.bubbles,
    title: 'Find your perfect cleaner',
    body: 'Browse background-checked, tier-rated cleaners in your ZIP code. Filter by service type, availability, and rating — then request in seconds.',
    cta: 'Next',
  },
  {
    icon: ICONS.calendar,
    bg: BACKGROUNDS.bubbles,
    title: 'Track every job live',
    body: 'See real-time GPS status as your cleaner heads over. Watch room-by-room photos upload as they clean — no guessing, no surprises.',
    cta: 'Next',
  },
  {
    icon: ICONS.checkmark,
    bg: BACKGROUNDS.bubbles,
    title: 'Trust-first, every time',
    body: 'Every cleaner passes a background check and identity verification. Tier ratings are earned through performance — not paid for. You approve before we charge.',
    cta: "Let's go",
  },
];

async function completeTour() {
  await fetch('/api/milestones/welcome-tour', { method: 'POST' });
}

export default function WelcomeTourPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  const current = SLIDES[slide]!;

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
    } else {
      startTransition(async () => {
        await completeTour();
        router.push('/app');
      });
    }
  };

  const handleSkip = () => {
    startTransition(async () => {
      await completeTour();
      router.push('/app');
    });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center overflow-hidden px-4 py-12">
      <Image
        src={current.bg}
        alt=""
        fill
        className="object-cover opacity-20"
        priority
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Image
          src={BRAND.dash}
          alt="Dash"
          width={80}
          height={80}
          className="drop-shadow-lg"
        />

        <Image
          src={current.icon}
          alt=""
          width={72}
          height={72}
          className="rounded-2xl shadow-tier2"
        />

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{current.title}</h1>
          <p className="mt-3 text-neutral-500">{current.body}</p>
        </div>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all duration-control ${
                i === slide ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={isPending}
          className="w-full rounded-xl bg-gradient-brand px-6 py-3 font-semibold text-white shadow-tier1 transition-all hover:shadow-tier2 hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? 'Loading…' : current.cta}
        </button>

        {slide < SLIDES.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-sm text-neutral-400 hover:text-neutral-600"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
