import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { BRAND } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Press Kit — PureTask',
  description:
    'Logos, boilerplate, fast facts, and brand colors for journalists and partners covering PureTask, the accountable home-cleaning marketplace launching in Sacramento.',
};

const FACTS = [
  { label: 'Company', value: 'PureTask' },
  { label: 'Category', value: 'Home services · cleaning marketplace' },
  { label: 'Headquarters', value: 'Sacramento, California' },
  { label: 'Launch market', value: 'Greater Sacramento' },
  { label: 'Founded', value: '2025' },
  {
    label: 'What it does',
    value:
      'Connects customers with background-checked independent cleaners; GPS-verified visits, photo proof per room, and pay-on-approval billing.',
  },
];

const COLORS = [
  { name: 'Deep Trust Blue', hex: '#0A3B78', className: 'bg-brand-900' },
  { name: 'Electric Service Blue', hex: '#169AF5', className: 'bg-brand-600' },
  { name: 'Clean Aqua', hex: '#40E8E0', className: 'bg-accent-400' },
  { name: 'Anchor Navy', hex: '#072A55', className: 'bg-navy-950' },
];

const SHORT_BOILERPLATE =
  'PureTask is an accountable home-cleaning marketplace. Every cleaner is background-checked and identity-verified; every visit is GPS-confirmed and documented with before/after photos; and customers are only charged once they approve the work. PureTask is launching in Greater Sacramento.';

const LONG_BOILERPLATE =
  'PureTask is a two-sided marketplace that connects homeowners and renters with independent professional cleaners. Unlike traditional booking apps, PureTask is built around accountability on both sides: cleaners clear Checkr background checks and Stripe Identity verification before taking jobs, clock in within 100 meters of the service address, and upload photo evidence for every room — with a 15-minute first-photo rule that confirms work started on time. Customer payments are authorized at booking but never captured until the customer approves the completed job, and a three-tier dispute system (direct resolution, admin mediation, platform decision) backs every clean. Cleaner reliability is recalculated nightly from six performance metrics; higher standing unlocks lower commission and higher maximum rates. PureTask is launching in Greater Sacramento and expanding market by market.';

export default function PressPage() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
            Press kit
          </p>
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">PureTask media resources</h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Everything you need to write about PureTask. For interviews or anything not covered
            here, email{' '}
            <a
              href="mailto:press@puretask.com"
              className="font-medium text-brand-600 hover:underline"
            >
              press@puretask.com
            </a>
            .
          </p>
        </div>

        {/* Logos */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Logos &amp; mark</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier1">
              <Image
                src={BRAND.logo}
                alt="PureTask logo"
                width={96}
                height={96}
                className="h-24 w-auto"
              />
              <a
                href={BRAND.logo}
                download
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50"
              >
                Download logo (PNG)
              </a>
            </div>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-navy-950 p-8 shadow-tier1">
              <Image
                src={BRAND.dash}
                alt="Dash, the PureTask mascot"
                width={96}
                height={96}
                className="h-24 w-auto"
              />
              <a
                href={BRAND.dash}
                download
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
              >
                Download mascot (PNG)
              </a>
            </div>
          </div>
          <p className="mt-4 text-sm text-neutral-400">
            Please don&apos;t alter the logo&apos;s colors, proportions, or orientation, or place it
            on low-contrast backgrounds.
          </p>
        </section>

        {/* Fast facts */}
        <section className="mb-16 rounded-2xl border border-neutral-200 p-8">
          <h2 className="mb-6 text-xl font-bold text-neutral-900">Fast facts</h2>
          <dl className="divide-y divide-neutral-100">
            {FACTS.map((f) => (
              <div key={f.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <dt className="w-44 shrink-0 text-sm font-medium text-neutral-400">{f.label}</dt>
                <dd className="text-sm text-neutral-700">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Boilerplate */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Boilerplate</h2>
          <div className="space-y-5">
            <div className="rounded-2xl bg-neutral-50 p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Short
              </p>
              <p className="text-sm leading-relaxed text-neutral-700">{SHORT_BOILERPLATE}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Long
              </p>
              <p className="text-sm leading-relaxed text-neutral-700">{LONG_BOILERPLATE}</p>
            </div>
          </div>
        </section>

        {/* Brand colors */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Brand colors</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {COLORS.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-2xl border border-neutral-200">
                <div className={`h-20 ${c.className}`} />
                <div className="p-3">
                  <p className="text-sm font-medium text-neutral-900">{c.name}</p>
                  <p className="text-xs uppercase text-neutral-400">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-hero p-8 text-center text-white">
          <h2 className="mb-2 text-2xl font-bold">Need something else?</h2>
          <p className="mx-auto mb-6 max-w-xl text-white/80">
            Founder interviews, market data, or custom assets — reach out and we&apos;ll turn it
            around quickly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:press@puretask.com"
              className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 transition-all hover:bg-white/90"
            >
              Email press@puretask.com
            </a>
            <Link
              href="/about"
              className="rounded-xl border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Read about PureTask
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
