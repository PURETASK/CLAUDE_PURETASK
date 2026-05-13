import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { BACKGROUNDS, BRAND, ICONS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Earn More as a PureTask Cleaner — Apply Now',
  description:
    'Keep 85–90% of every job. Build your reputation. Get paid weekly or instantly. Apply to join PureTask in Northern California.',
};

const BENEFITS = [
  {
    icon: ICONS.wallet,
    title: 'Competitive earnings',
    body: 'Set your own hourly rate within your tier range. PureTask takes 10–15% — far less than most platforms.',
  },
  {
    icon: ICONS.checkmark,
    title: 'Tier progression',
    body: 'Start as a Rising Pro and earn your way up to All-Star Expert. Higher tier = higher max rate + lower commission.',
  },
  {
    icon: ICONS.calendar,
    title: 'Weekly payouts',
    body: 'Every Friday at noon Pacific, automatically. Or request an instant payout any day for a 5% fee.',
  },
  {
    icon: ICONS.contacts,
    title: 'Real reputation',
    body: 'Your profile shows verified tier, ratings, and trait badges. Customers see a complete picture of your track record.',
  },
  {
    icon: ICONS.cleaning,
    title: 'Protected from disputes',
    body: 'Photo proof from your jobs protects you. If a customer files a frivolous dispute, our evidence review is on your side.',
  },
  {
    icon: ICONS.home,
    title: 'Only vetted customers',
    body: 'Customers have reliability scores visible to you. You can see their history before accepting requests.',
  },
];

const TIERS = [
  { name: 'Rising Pro', commission: '12–15%', note: 'Intro rate for first 6 jobs' },
  { name: 'Proven Specialist', commission: '13%', note: 'Earned after consistent performance' },
  { name: 'Top Performer', commission: '11%', note: '2-hour minimum unlocks' },
  { name: 'All-Star Expert', commission: '10%', note: 'Highest rates, lowest cut' },
];

export default function ForCleanersPage() {
  return (
    <>
      {/* Hero — cleaner banner photo */}
      <section className="relative overflow-hidden">
        <Image
          src={BACKGROUNDS.cleanerBanner}
          alt="PureTask cleaning professionals"
          width={1400}
          height={420}
          className="h-64 w-full object-cover sm:h-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-neutral-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-5xl px-6">
            <div className="max-w-lg">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-300">
                For cleaning professionals
              </p>
              <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Build your reputation.
                <br />
                Keep more of what you earn.
              </h1>
              <Link
                href="/cleaner/apply"
                className="inline-block rounded-xl bg-gradient-brand px-7 py-3 text-sm font-semibold text-white shadow-tier2 transition-all hover:brightness-110"
              >
                Apply to join PureTask
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-neutral-200 px-6">
          {[
            { value: '85–90%', label: 'You keep per job' },
            { value: '2 days', label: 'Avg payout time' },
            { value: '4.8★', label: 'Platform avg rating' },
          ].map(({ value, label }) => (
            <div key={label} className="px-6 py-5 text-center">
              <p className="text-2xl font-bold text-brand-600">{value}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-neutral-900">
            Why cleaners choose PureTask
          </h2>
          <p className="mb-12 text-center text-neutral-500">
            A platform built to protect and grow your cleaning business.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1 transition-all hover:shadow-tier2"
              >
                <Image src={b.icon} alt="" width={48} height={48} className="mb-4 rounded-xl" />
                <h3 className="mb-2 font-semibold text-neutral-900">{b.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-500">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier table */}
      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-center gap-4">
            <Image src={ICONS.checkmark} alt="" width={52} height={52} className="rounded-xl" />
            <div>
              <h2 className="text-3xl font-bold text-neutral-900">Tiers reward consistency</h2>
              <p className="mt-1 text-neutral-500">
                Your reliability score determines your tier. Tier up and you earn more with every
                job.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-neutral-700">Tier</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-neutral-700">
                    Commission
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-neutral-400">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {TIERS.map((t) => (
                  <tr key={t.name} className="hover:bg-neutral-50">
                    <td className="px-5 py-4 font-medium text-neutral-900">{t.name}</td>
                    <td className="px-5 py-4 font-bold text-brand-600">{t.commission}</td>
                    <td className="px-5 py-4 text-neutral-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA — Cleaners Wanted spotlight */}
      <section className="relative overflow-hidden">
        <Image src={BACKGROUNDS.cleanersWanted} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-neutral-900/70" />
        <div className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center">
          <Image
            src={BRAND.logo}
            alt="PureTask"
            width={64}
            height={64}
            className="mx-auto mb-6 drop-shadow-lg"
          />
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to apply?</h2>
          <p className="mb-8 text-neutral-300">
            Applications take about 15 minutes. Approval requires a background check and identity
            verification — usually done in 2–5 business days.
          </p>
          <Link
            href="/cleaner/apply"
            className="inline-block rounded-xl bg-gradient-brand px-10 py-4 text-base font-semibold text-white shadow-tier2 transition-all hover:brightness-110"
          >
            Start your application
          </Link>
        </div>
      </section>
    </>
  );
}
