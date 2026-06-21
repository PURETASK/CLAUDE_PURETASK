import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';

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

const CUSTOMER = [
  { label: 'Platform service fee', value: '$9.99', sub: 'Per booking, on top of cleaner rate' },
  {
    label: 'Booking authorization',
    value: 'Free',
    sub: 'Card held, not charged until you approve',
  },
  { label: 'Monthly fee', value: '$0', sub: 'No subscription required' },
];

export default function PricingPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">Transparent pricing</h1>
          <p className="text-lg text-neutral-500">
            No subscriptions. No hidden fees. Everyone sees the same numbers.
          </p>
        </div>

        {/* Customer pricing */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">For customers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CUSTOMER.map((item) => (
              <Card
                key={item.label}
                elevation={1}
                className="border border-neutral-200 p-5 text-center"
              >
                <p className="mb-1 text-3xl font-bold text-neutral-900">{item.value}</p>
                <p className="mb-1 text-sm font-semibold text-neutral-700">{item.label}</p>
                <p className="text-xs text-neutral-400">{item.sub}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Cleaner commissions */}
        <section className="mb-16">
          <h2 className="mb-2 text-2xl font-bold text-neutral-900">Cleaner commission rates</h2>
          <p className="mb-6 text-neutral-500">
            Commission drops as cleaners earn their tier. Higher tier = lower cut to the platform.
          </p>
          <Card elevation={1} className="overflow-hidden border border-neutral-200 p-0">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Tier</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500">Condition</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Platform fee
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Cleaner keeps
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500">Min hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {TIERS.map((t, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{t.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{t.note}</td>
                    <td className="px-4 py-3 text-neutral-700">{t.commission}</td>
                    <td className="px-4 py-3 font-semibold text-success-dark">{t.payout}</td>
                    <td className="px-4 py-3 text-neutral-500">{t.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 text-xs text-neutral-400">
            Commission is calculated on the cleaner subtotal (hourly rate × hours). The platform
            service fee ($9.99) paid by the customer is separate and goes entirely to PureTask.
          </p>
        </section>

        {/* Payouts */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Payout schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card elevation={1} className="border border-neutral-200 p-6">
              <p className="mb-2 text-xl font-bold text-neutral-900">Weekly — Free</p>
              <p className="text-sm text-neutral-500">
                Every Friday at noon Pacific. All earnings from approved jobs during the week are
                batched and transferred to your bank via Stripe.
              </p>
            </Card>
            <Card elevation={1} className="border border-warning/30 bg-warning-light p-6">
              <p className="mb-2 text-xl font-bold text-neutral-900">Instant — 5% fee</p>
              <p className="text-sm text-warning-dark/80">
                Request your balance immediately, any day. A 5% fee is deducted from the payout
                amount. Requires Stripe instant payouts to be enabled on your account.
              </p>
            </Card>
          </div>
        </section>

        {/* FAQ link */}
        <Card elevation={1} className="border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="mb-2 text-sm font-medium text-neutral-700">Still have questions?</p>
          <a href="/faq" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Read our full FAQ →
          </a>
        </Card>
      </div>
    </div>
  );
}
