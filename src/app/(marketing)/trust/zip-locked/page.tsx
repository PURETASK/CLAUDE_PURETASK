import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { ICONS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'ZIP-Locked Badge | PureTask',
  description:
    'What it means when a PureTask cleaner has the ZIP-Locked badge — proven in your exact neighborhood.',
};

const CRITERIA = [
  '25 or more completed jobs in your ZIP code',
  '4.7★ or higher average rating in that area',
  'No dispute history in the last 90 days',
  'Active and bookable in that ZIP',
];

const WHY = [
  'They know the neighborhood — parking, building access, local norms',
  "They've already satisfied customers like you nearby",
  'High repeat-booking rate from local customers',
  'Proven reliability, not just overall average',
];

export default function ZipLockedPage() {
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
          <h1 className="text-2xl font-bold text-neutral-900">ZIP-Locked Badge</h1>
          <p className="mt-2 text-neutral-600">
            This cleaner has a proven track record specifically in your ZIP code — not just on the
            platform overall.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="font-semibold text-neutral-900">How a cleaner earns it</h2>
          {CRITERIA.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10">
                <svg
                  className="h-3 w-3 text-brand-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="font-semibold text-neutral-900">Why it matters to you</h2>
          {WHY.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-600" />
              <span className="text-sm text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-100 p-5 text-center text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Badge auto-revokes</p>
          <p className="mt-1">
            If a cleaner drops below the threshold in that ZIP, the badge is removed automatically
            within 30 days. It reflects real, current performance — not past glory.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/app/cleaners"
            className="inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
          >
            Find ZIP-Locked cleaners near you
          </Link>
        </div>
      </div>
    </div>
  );
}
