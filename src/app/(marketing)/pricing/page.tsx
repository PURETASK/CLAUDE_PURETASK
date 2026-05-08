import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — PureTask',
  description:
    'Transparent fees for customers and cleaners. No subscriptions. Pay per booking. Cleaners keep 85–90% depending on tier.',
};

const TIERS = [
  { name: 'Rising Pro', note: 'First 6 jobs', commission: '12%', payout: '88%', min: '4 hrs' },
  { name: 'Rising Pro', note: 'After 6 jobs', commission: '15%', payout: '85%', min: '4 hrs' },
  { name: 'Proven Specialist', note: '', commission: '13%', payout: '87%', min: '4 hrs' },
  { name: 'Top Performer', note: '', commission: '11%', payout: '89%', min: '2 hrs' },
  { name: 'All-Star Expert', note: '', commission: '10%', payout: '90%', min: '2 hrs' },
];

export default function PricingPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Transparent pricing</h1>
          <p className="text-lg text-zinc-500">
            No subscriptions. No hidden fees. Everyone sees the same numbers.
          </p>
        </div>

        {/* Customer pricing */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">For customers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Platform service fee',
                value: '$9.99',
                sub: 'Per booking, on top of cleaner rate',
              },
              {
                label: 'Booking authorization',
                value: 'Free',
                sub: 'Card held, not charged until you approve',
              },
              { label: 'Monthly fee', value: '$0', sub: 'No subscription required' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center"
              >
                <p className="mb-1 text-3xl font-bold text-zinc-900">{item.value}</p>
                <p className="mb-1 text-sm font-semibold text-zinc-700">{item.label}</p>
                <p className="text-xs text-zinc-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cleaner commissions */}
        <section className="mb-16">
          <h2 className="mb-2 text-2xl font-bold">Cleaner commission rates</h2>
          <p className="mb-6 text-zinc-500">
            Commission drops as cleaners earn their tier. Higher tier = lower cut to the platform.
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">Tier</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Condition</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">Platform fee</th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-700">Cleaner keeps</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Min hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {TIERS.map((t, i) => (
                  <tr key={i} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{t.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{t.note}</td>
                    <td className="px-4 py-3 text-zinc-700">{t.commission}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{t.payout}</td>
                    <td className="px-4 py-3 text-zinc-500">{t.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Commission is calculated on the cleaner subtotal (hourly rate × hours). The platform
            service fee ($9.99) paid by the customer is separate and goes entirely to PureTask.
          </p>
        </section>

        {/* Payouts */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Payout schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-6">
              <p className="mb-2 text-xl font-bold text-zinc-900">Weekly — Free</p>
              <p className="text-sm text-zinc-500">
                Every Friday at noon Pacific. All earnings from approved jobs during the week are
                batched and transferred to your bank via Stripe.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <p className="mb-2 text-xl font-bold text-zinc-900">Instant — 5% fee</p>
              <p className="text-sm text-zinc-500">
                Request your balance immediately, any day. A 5% fee is deducted from the payout
                amount. Requires Stripe instant payouts to be enabled on your account.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ link */}
        <div className="rounded-xl bg-zinc-50 p-6 text-center">
          <p className="mb-2 text-sm font-medium text-zinc-700">Still have questions?</p>
          <a
            href="/faq"
            className="text-sm font-semibold text-zinc-900 underline hover:no-underline"
          >
            Read our full FAQ →
          </a>
        </div>
      </div>
    </div>
  );
}
