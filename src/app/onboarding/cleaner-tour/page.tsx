'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { BACKGROUNDS, BRAND, ICONS } from '@/lib/assets';

const SLIDES = [
  {
    icon: ICONS.cleaning,
    title: 'Getting jobs on PureTask',
    body: 'Customers find you based on your ZIP code, tier rating, and availability. Keep your calendar updated and respond quickly — fast responders get ranked higher.',
    cta: 'Next',
  },
  {
    icon: ICONS.calendar,
    title: 'The On My Way flow',
    body: 'When it\'s time for a job, tap "On My Way" in the app. The customer sees your live GPS and ETA in real time. Arrive on time to protect your reliability score.',
    cta: 'Next',
  },
  {
    icon: ICONS.cleaning2,
    title: 'Active job + photo uploads',
    body: 'Clock in when you arrive. As you clean each room, upload before/after photos directly in the app. These photos protect you and build customer trust.',
    cta: 'Next',
  },
  {
    icon: ICONS.wallet,
    title: 'Getting paid',
    body: "Payments are held securely until job completion and customer approval. You'll receive payouts to your connected bank account within 2 business days.",
    cta: 'Next',
  },
  {
    icon: ICONS.checkmark,
    title: 'Your score & tier',
    body: 'Every completed job earns you points toward Tier 2, 3, and Premium status. Higher tiers mean more visibility, better jobs, and higher earning potential.',
    cta: "Let's get started",
  },
];

async function completeCleanerTour() {
  await fetch('/api/milestones/cleaner-tour', { method: 'POST' });
}

export default function CleanerTourPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [isPending, startTransition] = useTransition();

  const current = SLIDES[slide]!;

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
    } else {
      startTransition(async () => {
        await completeCleanerTour();
        router.push('/app/cleaner');
      });
    }
  };

  const handleSkip = () => {
    startTransition(async () => {
      await completeCleanerTour();
      router.push('/app/cleaner');
    });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-57px)] flex-col items-center justify-center overflow-hidden px-4 py-12">
      <Image
        src={BACKGROUNDS.cleanersWanted}
        alt=""
        fill
        className="object-cover opacity-15"
        priority
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <Image src={BRAND.dash} alt="Dash" width={80} height={80} className="drop-shadow-lg" />

        <Image
          src={current.icon}
          alt=""
          width={72}
          height={72}
          className="rounded-2xl shadow-tier2"
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
            Cleaner platform tour · {slide + 1} of {SLIDES.length}
          </p>
          <h1 className="text-2xl font-bold text-neutral-900">{current.title}</h1>
          <p className="mt-3 text-neutral-500">{current.body}</p>
        </div>

        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
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
          <button onClick={handleSkip} className="text-sm text-neutral-400 hover:text-neutral-600">
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
