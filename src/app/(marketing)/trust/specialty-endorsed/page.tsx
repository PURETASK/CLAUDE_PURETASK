import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { ICONS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Specialty Endorsed Badge | PureTask',
  description: 'How PureTask cleaners earn specialty endorsements from real customer reviews.',
};

const SPECIALTIES = [
  { key: 'deep_clean', label: 'Deep Clean', desc: 'Thorough top-to-bottom cleaning beyond the standard scope' },
  { key: 'move_out', label: 'Move-Out', desc: 'Empty-property cleans for tenants and landlords' },
  { key: 'eco_products', label: 'Eco-Friendly', desc: 'Uses only non-toxic, environmentally safe products' },
  { key: 'pet_friendly', label: 'Pet-Friendly', desc: 'Comfortable with and experienced around pets' },
  { key: 'organizing', label: 'Organizing', desc: 'Decluttering and organizational help beyond cleaning' },
];

const HOW_EARNED = [
  'At least 10 completed jobs of that type',
  '4.8★ or higher specifically for that service type',
  'At least 3 customers independently mentioned it in their review text',
  'Zero disputes involving that service in the last 6 months',
];

export default function SpecialtyEndorsedPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        <Link href="/" className="text-sm text-brand-600 hover:underline">
          ← Home
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-tier2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image src={ICONS.checkmark} alt="" width={72} height={72} className="drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Specialty Endorsed</h1>
          <p className="mt-2 text-neutral-600">
            This cleaner has been recognized by real customers for exceptional skill in a specific
            type of cleaning. The badge comes from reviews — not self-reporting.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">Available specialty badges</h2>
          <div className="space-y-3">
            {SPECIALTIES.map((s) => (
              <div key={s.key} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10">
                  <svg className="h-3 w-3 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{s.label}</p>
                  <p className="text-xs text-neutral-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="font-semibold text-neutral-900">How a cleaner earns a specialty tag</h2>
          {HOW_EARNED.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-100 p-5 text-center text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Customers drive every badge</p>
          <p className="mt-1">
            PureTask reads review text using keyword and sentiment analysis. Cleaners cannot claim
            specialties — only customers can grant them through honest feedback.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/app/cleaners"
            className="inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Browse specialty-endorsed cleaners
          </Link>
        </div>
      </div>
    </div>
  );
}
