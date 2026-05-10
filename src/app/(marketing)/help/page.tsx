import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | PureTask',
  description: 'Find answers to your questions about booking, payments, and more.',
};

const TOPICS = [
  { icon: '📅', label: 'Booking & Scheduling', href: '/help/booking' },
  { icon: '💳', label: 'Payment & Pricing', href: '/help/payment' },
  { icon: '📸', label: 'Photos & Privacy', href: '/help/photos' },
  { icon: '🛡', label: 'Trust & Safety', href: '/help/trust' },
  { icon: '🧹', label: 'For Cleaners', href: '/help/cleaners' },
  { icon: '⚙️', label: 'Account & Settings', href: '/help/account' },
] as const;

const POPULAR_ARTICLES = [
  { title: 'How does payment work?', href: '/help/payment#how-it-works' },
  { title: 'Can I request the same cleaner again?', href: '/help/booking#same-cleaner' },
  { title: 'What happens if I need to cancel?', href: '/help/booking#cancellation' },
  { title: 'How are cleaners verified?', href: '/help/trust#verification' },
  { title: 'When will I receive my payout?', href: '/help/cleaners#payouts' },
  { title: 'How do I dispute a job?', href: '/help/booking#disputes' },
] as const;

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">How can we help?</h1>
          <p className="mt-2 text-neutral-600">Search or browse articles below.</p>
        </div>

        <div className="relative">
          <input
            type="search"
            placeholder="Search help articles…"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm shadow-tier1 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
          <svg
            className="absolute right-4 top-4 h-5 w-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div>
          <h2 className="mb-4 font-semibold text-neutral-900">Browse by topic</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TOPICS.map(({ icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-tier1 transition-colors hover:border-brand-600/30 hover:bg-brand-600/5"
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-sm font-medium text-neutral-900">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-semibold text-neutral-900">Popular articles</h2>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-tier1 divide-y divide-neutral-100">
            {POPULAR_ARTICLES.map(({ title, href }) => (
              <Link
                key={title}
                href={href}
                className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50"
              >
                <span className="text-sm text-neutral-700">{title}</span>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-tier1">
          <p className="font-semibold text-neutral-900">Can&apos;t find what you&apos;re looking for?</p>
          <p className="mt-1 text-sm text-neutral-600">Our support team typically responds within 2 hours.</p>
          <a
            href="mailto:support@puretask.com"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
