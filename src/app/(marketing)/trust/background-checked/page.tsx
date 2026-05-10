import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Background Checked by Checkr | PureTask',
  description: 'Every PureTask cleaner passes a comprehensive background check powered by Checkr.',
};

const VERIFIED = [
  'Identity verification',
  'National criminal records',
  'Sex offender registry',
  'County court records',
];

const NOT_DONE = [
  "We never share personal details with customers",
  'No ongoing surveillance',
  'No continuous monitoring',
];

const BackgroundCheckedPage = () => {
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
            🛡
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Background Checked by Checkr</h1>
          <p className="mt-2 text-neutral-600">
            Every cleaner on PureTask undergoes a comprehensive background check before their first job.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1 space-y-3">
          <h2 className="font-semibold text-neutral-900">What we verify</h2>
          {VERIFIED.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success/10">
                <svg className="h-3.5 w-3.5 text-success-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1 space-y-3">
          <h2 className="font-semibold text-neutral-900">What we don&apos;t do</h2>
          {NOT_DONE.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-sm text-neutral-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-100 p-5 text-center text-sm text-neutral-600 space-y-1">
          <p className="font-medium text-neutral-900">Renewed every 2 years</p>
          <p>Powered by Checkr — the industry standard for professional background checks.</p>
        </div>
      </div>
    </div>
  );
};

export default BackgroundCheckedPage;
