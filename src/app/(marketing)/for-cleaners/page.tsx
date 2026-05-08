import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earn More as a PureTask Cleaner — Apply Now',
  description:
    'Keep 85–90% of every job. Build your reputation. Get paid weekly or instantly. Apply to join PureTask in Northern California.',
};

const BENEFITS = [
  {
    icon: '💰',
    title: 'Competitive earnings',
    body: 'Set your own hourly rate within your tier range. PureTask takes 10–15% — far less than most platforms.',
  },
  {
    icon: '📈',
    title: 'Tier progression',
    body: 'Start as a Rising Pro and earn your way up to All-Star Expert. Higher tier = higher max rate + lower commission.',
  },
  {
    icon: '📅',
    title: 'Weekly payouts',
    body: 'Every Friday at noon Pacific, automatically. Or request an instant payout any day for a 5% fee.',
  },
  {
    icon: '⭐',
    title: 'Real reputation',
    body: 'Your profile shows verified tier, ratings, and trait badges. Customers see a complete picture of your track record.',
  },
  {
    icon: '🛡️',
    title: 'Protected from disputes',
    body: "Photo proof from your jobs protects you. If a customer files a frivolous dispute, PureTask's evidence review is on your side.",
  },
  {
    icon: '🔒',
    title: 'Only vetted customers',
    body: 'Customers have reliability scores visible to you. You can see their history before accepting requests.',
  },
];

const TIERS = [
  { name: 'Rising Pro', commission: '12% → 15%', note: 'Intro rate for first 6 jobs' },
  { name: 'Proven Specialist', commission: '13%', note: 'Earned after consistent performance' },
  { name: 'Top Performer', commission: '11%', note: '2-hour minimum unlocks' },
  { name: 'All-Star Expert', commission: '10%', note: 'Highest rates, lowest cut' },
];

export default function ForCleanersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-amber-400 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-800">
            For cleaning professionals
          </p>
          <h1 className="mb-5 text-4xl font-bold text-zinc-900">
            Build your reputation. Keep more of what you earn.
          </h1>
          <p className="mb-8 text-lg text-zinc-700">
            PureTask cleaners keep 85–90% of every job and build a verified track record that
            attracts premium customers.
          </p>
          <Link
            href="/cleaner/apply"
            className="rounded-xl bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white hover:bg-zinc-700"
          >
            Apply to join PureTask
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Why cleaners choose PureTask</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-zinc-100 p-6">
                <p className="mb-3 text-3xl">{b.icon}</p>
                <h3 className="mb-2 font-semibold text-zinc-900">{b.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier table */}
      <section className="bg-zinc-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Tiers reward consistency</h2>
          <p className="mb-10 text-center text-zinc-500">
            Your reliability score — updated nightly from 6 metrics — determines your tier. Tier up
            and you earn more with every job.
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-700">Tier</th>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-700">Commission</th>
                  <th className="px-5 py-3 text-left font-medium text-zinc-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {TIERS.map((t) => (
                  <tr key={t.name + t.commission}>
                    <td className="px-5 py-3 font-medium text-zinc-900">{t.name}</td>
                    <td className="px-5 py-3 font-semibold text-green-700">{t.commission}</td>
                    <td className="px-5 py-3 text-zinc-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold">Ready to apply?</h2>
          <p className="mb-8 text-zinc-500">
            Applications take about 15 minutes. Approval requires a background check and identity
            verification — usually done in 2–5 business days.
          </p>
          <Link
            href="/cleaner/apply"
            className="rounded-xl bg-zinc-900 px-8 py-3.5 text-base font-semibold text-white hover:bg-zinc-700"
          >
            Start your application
          </Link>
        </div>
      </section>
    </>
  );
}
