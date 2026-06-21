import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ChevronDown,
  Sparkles,
  Droplets,
  Package,
  BedDouble,
  MapPin,
  Users,
  Navigation,
  CheckCircle,
  Star,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PureTask — Trusted House Cleaning across Northern California',
  description:
    'From San Francisco to Reno. Background-checked cleaners, GPS check-in, photo proof — pay only when you approve the work.',
};

const TRUST_CHIPS = ['Background-checked', 'GPS verified', 'Photo proof'];

const TOP_CLEANERS = [
  { name: 'Maria L.', rating: '4.9', jobs: '240 cleanings', area: 'SF · Oakland' },
  { name: 'James K.', rating: '4.8', jobs: '180 cleanings', area: 'Sacramento' },
  { name: 'Aisha P.', rating: '5.0', jobs: '95 cleanings', area: 'Reno · Sparks' },
];

const SERVICES = [
  {
    icon: Sparkles,
    name: 'Standard cleaning',
    desc: 'Surfaces, kitchen, bathrooms, vacuum, mop',
    meta: '2–3 hrs · from $50',
  },
  {
    icon: Droplets,
    name: 'Deep clean',
    desc: 'Standard plus baseboards, inside oven, behind appliances',
    meta: '4–6 hrs · from $120',
  },
  {
    icon: Package,
    name: 'Move-out cleaning',
    desc: 'Empty home, deep clean, deposit-ready',
    meta: '5–8 hrs · from $180',
  },
  {
    icon: BedDouble,
    name: 'Airbnb turnover',
    desc: 'Same-day window, linen swap, photo confirmation',
    meta: '2–4 hrs · from $70',
  },
];

const HOW_STEPS = [
  {
    icon: MapPin,
    title: 'Tell us what and where',
    desc: 'Address and cleaning type. Two fields, no signup yet.',
  },
  {
    icon: Users,
    title: 'Pick a cleaner you trust',
    desc: 'Faces, ratings, hourly rate, neighborhoods served.',
  },
  {
    icon: Navigation,
    title: 'Watch the job happen live',
    desc: 'GPS check-in, photo updates, real-time progress.',
  },
  {
    icon: CheckCircle,
    title: 'Approve and pay',
    desc: 'Review the photos. Release payment. Or dispute it.',
  },
];

const REVIEWS = [
  {
    text: 'Walked into a sparkling apartment. The before/after photos sold me, the actual cleaning kept me.',
    meta: 'Sarah · Deep clean by Maria L. · 2 weeks ago',
  },
  {
    text: 'I host four Airbnbs. The GPS check-in alone is worth it. I know exactly when turnover starts.',
    meta: 'Marcus · Airbnb turnover by James K. · 1 month ago',
  },
];

const CITIES = [
  'San Francisco',
  'Oakland',
  'Berkeley',
  'San Jose',
  'Sacramento',
  'Davis',
  'Roseville',
  'Reno',
  'Sparks',
];

function Stars({ size = 14 }: { size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="fill-amber-400 text-amber-400"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="pb-3 pt-10 sm:pt-14">
        <h1 className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
          Trusted house cleaning across Northern California
        </h1>
        <p className="mb-4 text-[15px] leading-relaxed text-neutral-500 sm:text-base">
          From San Francisco to Reno. Background-checked cleaners, GPS check-in, photo proof, pay
          only when satisfied.
        </p>
        <div className="flex flex-wrap gap-2">
          {TRUST_CHIPS.map((c) => (
            <span
              key={c}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── SEARCH / QUOTE CARD ─────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-2xl border border-neutral-200 p-4 shadow-tier1">
          <label className="mb-1.5 block text-xs font-medium text-neutral-500">Where</label>
          <div className="mb-3.5 flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-400">
            <span>ZIP code or full address</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <label className="mb-1.5 block text-xs font-medium text-neutral-500">
            What kind of cleaning
          </label>
          <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900">
            <span>Standard cleaning</span>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </div>
          <Link
            href="/app/cleaners"
            className="block rounded-lg bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            See cleaners from $50
          </Link>
          <p className="mt-2 text-center text-[11px] text-neutral-400">
            No payment until you approve the job
          </p>
        </div>
      </section>

      {/* ── TOP-RATED CLEANERS ──────────────────────────────────────── */}
      <section className="mb-9">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            Top-rated cleaners on PureTask
          </h2>
          <Link
            href="/app/cleaners"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            See all
          </Link>
        </div>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
          {TOP_CLEANERS.map((c) => (
            <div
              key={c.name}
              className="w-[150px] flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 sm:w-auto"
            >
              <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-brand-50 to-accent-400/10">
                <Users className="h-8 w-8 text-brand-600/40" />
              </div>
              <div className="p-2.5">
                <div className="text-[13px] font-semibold text-neutral-900">{c.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {c.rating} · {c.jobs}
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-400">{c.area}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PICK THE CLEANING THAT FITS ─────────────────────────────── */}
      <section className="mb-9">
        <h2 className="mb-3 text-[15px] font-semibold text-neutral-900">
          Pick the cleaning that fits
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.name}
              href="/app/cleaners"
              className="flex gap-3 overflow-hidden rounded-xl border border-neutral-200 transition-shadow hover:shadow-tier1"
            >
              <div className="flex w-[88px] flex-shrink-0 items-center justify-center bg-gradient-to-br from-brand-50 to-accent-400/10">
                <s.icon className="h-7 w-7 text-brand-600/50" />
              </div>
              <div className="py-3 pr-3">
                <div className="text-sm font-semibold text-neutral-900">{s.name}</div>
                <div className="mt-0.5 text-xs leading-snug text-neutral-500">{s.desc}</div>
                <div className="mt-1.5 text-xs font-medium text-brand-700">{s.meta}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SEE EXACTLY WHAT YOU PAID FOR ───────────────────────────── */}
      <section className="-mx-5 mb-9 bg-neutral-50 px-5 py-6 sm:mx-0 sm:rounded-2xl sm:px-6">
        <h2 className="mb-1 text-[15px] font-semibold text-neutral-900">
          See exactly what you paid for
        </h2>
        <p className="mb-3.5 text-xs leading-relaxed text-neutral-500">
          Every cleaning is documented room by room. Approve or dispute on real evidence — not
          promises.
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:max-w-md">
          {['Before', 'After', 'Before', 'After'].map((label, i) => (
            <div
              key={i}
              className="flex aspect-square items-end rounded-lg border border-neutral-200 bg-white p-2"
            >
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW A PURETASK CLEANING WORKS ───────────────────────────── */}
      <section className="mb-9">
        <h2 className="mb-4 text-[15px] font-semibold text-neutral-900">
          How a PureTask cleaning works
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_STEPS.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-brand-600">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="pt-0.5">
                <div className="text-[13px] font-semibold text-neutral-900">
                  <span className="text-neutral-400">{i + 1}. </span>
                  {s.title}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT CUSTOMERS SAY ──────────────────────────────────────── */}
      <section className="mb-9">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-neutral-900">What customers say</h2>
          <Link href="/reviews" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            All reviews
          </Link>
        </div>
        <div className="mb-3.5 flex items-center gap-2">
          <Stars />
          <span className="text-xs text-neutral-500">4.9 average · 1,247 cleanings</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {REVIEWS.map((r) => (
            <div key={r.meta} className="rounded-lg border border-neutral-200 p-3">
              <Stars size={12} />
              <p className="my-2 text-[13px] leading-relaxed text-neutral-800">{r.text}</p>
              <p className="text-[11px] text-neutral-500">{r.meta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHERE WE CLEAN ──────────────────────────────────────────── */}
      <section className="mb-9">
        <h2 className="mb-3 text-[15px] font-semibold text-neutral-900">Where we clean</h2>
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((city) => (
            <span
              key={city}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700"
            >
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* ── ARE YOU A CLEANER? ──────────────────────────────────────── */}
      <section className="rounded-2xl bg-neutral-50 p-5">
        <div className="text-sm font-semibold text-neutral-900">Are you a cleaner?</div>
        <p className="mb-3 mt-1 text-xs leading-relaxed text-neutral-500">
          Keep 80–85% per job. Set your own rates and schedule. Weekly payouts.
        </p>
        <Link
          href="/for-cleaners"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-neutral-900 transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          Apply to clean <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </main>
  );
}
