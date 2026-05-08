import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How PureTask Works — Book Verified Cleaners',
  description:
    'From browsing to approval — learn exactly how PureTask connects you with background-checked, GPS-verified cleaners in Northern California.',
};

const CUSTOMER_STEPS = [
  {
    title: 'Create your account',
    body: 'Sign up in under a minute. Add your service address and a payment method.',
  },
  {
    title: 'Browse and match',
    body: 'Our Match Score algorithm surfaces cleaners by distance, tier, availability, and specialty — filtered to your ZIP code.',
  },
  {
    title: 'Book and authorize',
    body: 'Select a time and confirm. Your card is authorized (held) but never charged until you approve the work.',
  },
  {
    title: 'Get notified',
    body: "You receive email confirmation when your cleaner accepts. You'll get entry instructions 2 hours before the job.",
  },
  {
    title: 'Review photo proof',
    body: 'Your cleaner uploads before/after photos for every room. A 15-minute first-photo rule ensures they started on time.',
  },
  {
    title: 'Approve or dispute',
    body: 'When the job is done, approve the work to release payment. If anything is off, open a dispute within 48 hours.',
  },
];

const CLEANER_STEPS = [
  {
    title: 'Apply and get verified',
    body: 'Complete our background check (Checkr) and identity verification (Stripe Identity). Takes 2–5 days.',
  },
  {
    title: 'Set up Connect payouts',
    body: 'Connect your bank via Stripe. Choose between free weekly payouts or instant payouts with a 5% fee.',
  },
  {
    title: 'Receive booking requests',
    body: 'You have 4 hours to accept or decline. After acceptance, the job is locked and payment authorized.',
  },
  {
    title: 'Do the job, submit photos',
    body: 'Clock in within 100m of the address. Upload required room photos before you clock out.',
  },
  {
    title: 'Build your tier',
    body: "Your reliability score updates nightly from 6 metrics. Hit the threshold and you're promoted — lower commission, higher max rate.",
  },
  {
    title: 'Get paid',
    body: 'When the customer approves, earnings land in your next Friday payout. All-Star Experts keep 90% of their subtotal.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">How PureTask works</h1>
          <p className="text-lg text-zinc-500">
            A full-accountability loop — from booking to payment — for both sides of the
            marketplace.
          </p>
        </div>

        {/* Customer flow */}
        <section className="mb-20">
          <h2 className="mb-8 text-2xl font-bold">For customers</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {CUSTOMER_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-zinc-100 p-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="mb-1 font-semibold text-zinc-900">{s.title}</p>
                  <p className="text-sm leading-relaxed text-zinc-500">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Book your first clean
            </Link>
          </div>
        </section>

        {/* Cleaner flow */}
        <section className="mb-16 rounded-2xl bg-zinc-50 p-8">
          <h2 className="mb-8 text-2xl font-bold">For cleaners</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {CLEANER_STEPS.map((s, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-zinc-900">
                  {i + 1}
                </span>
                <div>
                  <p className="mb-1 font-semibold text-zinc-900">{s.title}</p>
                  <p className="text-sm leading-relaxed text-zinc-500">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/for-cleaners"
              className="rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-300"
            >
              Learn about cleaner earnings →
            </Link>
          </div>
        </section>

        {/* Dispute */}
        <section className="rounded-2xl border border-zinc-200 p-8">
          <h2 className="mb-4 text-xl font-bold">The 3-tier dispute system</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                tier: 'Direct',
                desc: 'Cleaner offers re-clean, partial refund, or stands by their work. Customer accepts or escalates.',
              },
              {
                tier: 'Mediation',
                desc: "Admin reviews photo evidence and the conversation thread if direct resolution doesn't settle it.",
              },
              {
                tier: 'Platform decision',
                desc: 'Final rubric-based decision using photo coverage and work standard guidelines.',
              },
            ].map((t) => (
              <div key={t.tier} className="rounded-lg bg-zinc-50 p-4">
                <p className="mb-1 text-sm font-semibold text-zinc-700">{t.tier}</p>
                <p className="text-sm text-zinc-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
