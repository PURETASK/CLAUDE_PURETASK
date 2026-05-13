import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About PureTask — Accountable Home Cleaning in Northern California',
  description:
    'PureTask is a two-sided cleaning marketplace built around accountability: background-checked cleaners, GPS-verified visits, photo proof of every room, and pay-on-approval. Launching in Sacramento.',
};

const PILLARS = [
  {
    title: 'Verified people',
    body: 'Every cleaner clears a Checkr background check and Stripe Identity verification before they take a single job. Badges for insurance, neighborhood expertise, and specialties are earned, not bought.',
  },
  {
    title: 'Proof, not promises',
    body: 'Cleaners clock in within 100m of your address and upload before/after photos for every room. A 15-minute first-photo rule means you know the job actually started on time.',
  },
  {
    title: 'Pay on approval',
    body: "Your card is authorized when you book, but never charged until you approve the work. If something's off, our three-tier dispute system has your back.",
  },
  {
    title: 'A score that means something',
    body: 'Cleaner reliability is recalculated nightly from six real metrics — punctuality, completion, cancellations, photo coverage, ratings, and disputes. Better standing unlocks lower commission and higher rates.',
  },
];

const FACTS = [
  { label: 'Headquarters', value: 'Sacramento, California' },
  { label: 'Launch market', value: 'Greater Sacramento' },
  { label: 'Model', value: 'Two-sided marketplace (customers ↔ independent cleaners)' },
  { label: 'Payments', value: 'Stripe — authorize on booking, capture on approval' },
  { label: 'Verification', value: 'Checkr background checks · Stripe Identity' },
];

export default function AboutPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
            About PureTask
          </p>
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">
            Home cleaning you can actually hold accountable.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Booking a stranger to spend two hours alone in your home takes trust. PureTask is built
            so that trust isn&apos;t blind — it&apos;s backed by verification, GPS, photo evidence,
            and a payment that doesn&apos;t move until you say so.
          </p>
        </div>

        <section className="mb-16 rounded-2xl bg-gradient-hero p-8 text-white sm:p-10">
          <h2 className="mb-3 text-2xl font-bold">Why we started in Sacramento</h2>
          <p className="max-w-3xl text-white/80">
            We&apos;re launching in one metro on purpose. A cleaning marketplace only works when
            there are enough trusted cleaners in <em>your</em> ZIP code on <em>your</em> day — so we
            would rather be excellent in Sacramento first than thin everywhere. As we grow, every
            cleaner who joins is verified the same way, and every neighborhood we open gets the same
            standard. If we&apos;re not in your area yet, you can join the waitlist and we&apos;ll
            tell you the moment we are.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-neutral-900">What we stand for</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1"
              >
                <p className="mb-2 font-semibold text-neutral-900">{p.title}</p>
                <p className="text-sm leading-relaxed text-neutral-500">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 rounded-2xl border border-neutral-200 p-8">
          <h2 className="mb-6 text-xl font-bold text-neutral-900">The basics</h2>
          <dl className="divide-y divide-neutral-100">
            {FACTS.map((f) => (
              <div key={f.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <dt className="w-48 shrink-0 text-sm font-medium text-neutral-400">{f.label}</dt>
                <dd className="text-sm text-neutral-700">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-neutral-500">
            Press or partnership questions? See our{' '}
            <Link href="/press" className="font-medium text-brand-600 hover:underline">
              press kit
            </Link>
            .
          </p>
        </section>

        <section className="rounded-2xl bg-neutral-50 p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-neutral-900">Two ways to be part of it</h2>
          <p className="mx-auto mb-6 max-w-xl text-neutral-500">
            Book a cleaner you can trust, or get verified and start earning on a platform that
            rewards reliability.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:shadow-tier2 hover:brightness-110"
            >
              Book your first clean
            </Link>
            <Link
              href="/for-cleaners"
              className="rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-100"
            >
              Become a cleaner
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
