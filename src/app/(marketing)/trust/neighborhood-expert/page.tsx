import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trusted in Your Neighborhood | PureTask',
  description:
    'The Neighborhood Expert badge recognizes cleaners with proven track records in your specific area.',
};

const CRITERIA = [
  { label: '25+ completed jobs', detail: 'in the same ZIP code' },
  { label: '4.7+ average rating', detail: 'from jobs in that area' },
  { label: 'Actively working', detail: 'at least 1 job in the last 90 days' },
];

const NeighborhoodExpertPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-lg px-4 py-12 space-y-6">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← Home
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier2 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-600/10 text-4xl">
            🏠
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Trusted in [Your Neighborhood]</h1>
          <p className="mt-2 text-neutral-600">
            This badge is earned through consistent, high-quality work in a specific area — not just
            anywhere.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1 space-y-4">
          <h2 className="font-semibold text-neutral-900">How it&apos;s earned</h2>
          <p className="text-sm text-neutral-600">
            Every badge is ZIP-code specific. A cleaner can hold multiple neighborhood badges across
            the areas they serve.
          </p>
          <div className="space-y-3">
            {CRITERIA.map(({ label, detail }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10">
                  <svg className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{label}</p>
                  <p className="text-xs text-neutral-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-100 p-5 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Why this matters to you</p>
          <p className="mt-1">
            When you search for a cleaner, neighborhood experts show up first in your area — they
            know the local streets, parking, and building access patterns that make every job
            smoother.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodExpertPage;
