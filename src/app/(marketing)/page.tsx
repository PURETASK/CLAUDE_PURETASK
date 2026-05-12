import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { ICONS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'PureTask — Verified Home Cleaning in Northern California',
  description:
    "Book background-checked, GPS-verified cleaners. Pay only when you approve the work. PureTask is Northern California's trust-first cleaning marketplace.",
};

const STEPS = [
  {
    num: '01',
    title: 'Browse verified cleaners',
    body: 'Every cleaner is background-checked, identity-verified, and rated by real customers in your area.',
  },
  {
    num: '02',
    title: 'Book with confidence',
    body: 'Your payment is authorized but not captured until you approve the completed work. No pay-before-you-see-it.',
  },
  {
    num: '03',
    title: 'Approve and review',
    body: 'After the clean, approve the work or raise a dispute. A 48-hour window gives you time to evaluate.',
  },
];

const TRUST = [
  { icon: ICONS.checkmark, label: 'Background checked', sub: 'Every cleaner runs through Checkr' },
  { icon: ICONS.cleaning, label: 'Photo proof', sub: 'Before/after photos on every job' },
  { icon: ICONS.home, label: 'GPS verified', sub: 'Clock-in at your address, every time' },
  { icon: ICONS.cleaning2, label: 'Tier reputation', sub: '4 tiers earned through real performance' },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero — Clean Aero Glow brand treatment */}
      <section className="bg-gradient-hero px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent-400/80">
            Northern California
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
            Home cleaning you can <span className="text-accent-400">actually trust</span>
          </h1>
          <p className="mb-10 text-lg text-white/80">
            Background-checked cleaners, GPS-verified arrivals, photo proof of every job. Pay only
            when you approve the work.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-900 shadow-tier2 transition-all duration-control hover:shadow-tier3 hover:brightness-105 active:scale-[0.98]"
            >
              Book your first clean
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white/90 transition-all duration-control hover:border-white/60 hover:text-white"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            Three steps to a spotless home
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6 shadow-tier1 transition-shadow duration-card hover:shadow-tier2"
              >
                <p className="mb-3 text-3xl font-black text-brand-600/20">{s.num}</p>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-y border-neutral-100 bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            Built on accountability
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div
                key={t.label}
                className="rounded-2xl bg-white p-6 shadow-tier1 transition-shadow duration-card hover:shadow-tier2"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <Image src={t.icon} alt="" width={28} height={28} className="object-contain" />
                </div>
                <p className="mb-1 font-semibold text-neutral-900">{t.label}</p>
                <p className="text-sm text-neutral-500">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier callout */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-900">
            Reputation is earned, not assumed
          </h2>
          <p className="mb-8 text-neutral-500">
            PureTask cleaners move through four tiers — Rising Pro, Proven Specialist, Top
            Performer, and All-Star Expert — based on real ratings, on-time arrivals, and photo
            compliance. Higher tiers mean better rates and lower commissions.
          </p>
          <Link
            href="/how-it-works"
            className="text-sm font-semibold text-brand-600 underline transition-colors duration-micro hover:text-brand-900 hover:no-underline"
          >
            Learn about our tier system →
          </Link>
        </div>
      </section>

      {/* CTA banner — navy depth */}
      <section className="bg-navy-950 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold">Ready for a clean you can count on?</h2>
          <p className="mb-8 text-white/60">
            Join homeowners across Northern California who trust PureTask for predictable, verified
            cleaning.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center rounded-xl bg-gradient-premium px-8 py-3.5 text-base font-semibold text-navy-950 shadow-tier2 transition-all duration-control hover:shadow-tier3 hover:brightness-105 active:scale-[0.98]"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>
    </>
  );
}
