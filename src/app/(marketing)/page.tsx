import Link from 'next/link';
import type { Metadata } from 'next';

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
  { icon: '🔍', label: 'Background checked', sub: 'Every cleaner runs through Checkr' },
  { icon: '📸', label: 'Photo proof', sub: 'Before/after photos on every job' },
  { icon: '📍', label: 'GPS verified', sub: 'Clock-in at your address, every time' },
  { icon: '⭐', label: 'Tier reputation', sub: '4 tiers earned through real performance' },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-zinc-950 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Northern California
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight">
            Home cleaning you can <span className="text-amber-400">actually trust</span>
          </h1>
          <p className="mb-10 text-lg text-zinc-300">
            Background-checked cleaners, GPS-verified arrivals, photo proof of every job. Pay only
            when you approve the work.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-amber-400 px-8 py-3.5 text-base font-semibold text-zinc-900 hover:bg-amber-300"
            >
              Book your first clean
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-zinc-700 px-8 py-3.5 text-base font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Three steps to a spotless home</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
                <p className="mb-3 text-3xl font-black text-zinc-200">{s.num}</p>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-y border-zinc-100 bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Built on accountability</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.label} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="mb-3 text-3xl">{t.icon}</p>
                <p className="mb-1 font-semibold text-zinc-900">{t.label}</p>
                <p className="text-sm text-zinc-500">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier callout */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Reputation is earned, not assumed</h2>
          <p className="mb-8 text-zinc-500">
            PureTask cleaners move through four tiers — Rising Pro, Proven Specialist, Top
            Performer, and All-Star Expert — based on real ratings, on-time arrivals, and photo
            compliance. Higher tiers mean better rates and lower commissions.
          </p>
          <Link
            href="/how-it-works"
            className="text-sm font-semibold text-zinc-900 underline hover:no-underline"
          >
            Learn about our tier system →
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-zinc-950 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold">Ready for a clean you can count on?</h2>
          <p className="mb-8 text-zinc-400">
            Join homeowners across Northern California who trust PureTask for predictable, verified
            cleaning.
          </p>
          <Link
            href="/auth/sign-up"
            className="rounded-xl bg-amber-400 px-8 py-3.5 text-base font-semibold text-zinc-900 hover:bg-amber-300"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>
    </>
  );
}
