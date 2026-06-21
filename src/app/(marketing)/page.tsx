import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Shield,
  MapPin,
  Camera,
  CheckCircle,
  Eye,
  Lock,
  Fingerprint,
  Smartphone,
  Calendar,
  Users,
  Heart,
  ArrowRight,
  Quote,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PureTask — Verified Home Cleaning in Northern California',
  description:
    "Book background-checked, GPS-verified cleaners. Pay only when you approve the work. PureTask is Northern California's trust-first cleaning marketplace.",
};

const PROOF_BAR = [
  { icon: Shield, label: 'Background-Checked' },
  { icon: MapPin, label: 'GPS Verified' },
  { icon: Camera, label: 'Photo Documented' },
  { icon: CheckCircle, label: 'Approval Before Payment' },
];

const WHY_SAFER = [
  {
    icon: Eye,
    title: 'You see everything',
    desc: 'Before & after photos, GPS timestamps, and real-time status updates — no black box.',
    tile: 'bg-brand-50 border-brand-300 text-brand-600',
  },
  {
    icon: Lock,
    title: 'Your money stays protected',
    desc: 'Payment is authorized but held until you approve the work. Disputes keep your funds safe.',
    tile: 'bg-green-50 border-green-300 text-green-600',
  },
  {
    icon: Fingerprint,
    title: 'Every cleaner is vetted',
    desc: 'Comprehensive background checks, identity verification, and annual renewals — before they ever enter your home.',
    tile: 'bg-violet-50 border-violet-300 text-violet-600',
  },
  {
    icon: Smartphone,
    title: 'Built with modern tech',
    desc: 'Smart matching, GPS-verified arrivals, and an app designed from the ground up — not bolted onto legacy systems.',
    tile: 'bg-amber-50 border-amber-300 text-amber-600',
  },
];

const STEPS = [
  {
    step: '01',
    icon: Calendar,
    title: 'Book in 60 seconds',
    desc: "Pick your cleaning type, hours, and date. That's it.",
  },
  {
    step: '02',
    icon: Users,
    title: 'Get matched',
    desc: 'We pair you with a verified cleaner based on your needs and location.',
  },
  {
    step: '03',
    icon: Camera,
    title: 'They clean & document',
    desc: 'GPS check-in, before & after photos — full transparency throughout.',
  },
  {
    step: '04',
    icon: Heart,
    title: 'You approve & pay',
    desc: "Review the results. Payment releases only when you're satisfied.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I could see my cleaner check in by GPS and the before/after photos before I paid. I finally trust booking a stranger.',
    name: 'Maria R.',
    role: 'Sacramento',
  },
  {
    quote:
      'The escrow approval is the whole thing for me. Money only moves when the work is actually done right.',
    name: 'James T.',
    role: 'Roseville',
  },
  {
    quote:
      'Cleanest booking experience I’ve used. No black box — I know exactly what’s happening the whole time.',
    name: 'Priya N.',
    role: 'Folsom',
  },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88dvh] items-center overflow-hidden sm:min-h-[90dvh]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/brand/spring-cleaning-hero.webp"
            alt="Pristine clean home"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right-bottom opacity-60 sm:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/55 sm:bg-gradient-to-r sm:via-white/80 sm:to-white/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
        </div>

        {/* Dash — bubble personality merged into the photo hero */}
        <Image
          src="/brand/dash-front.png"
          alt=""
          width={150}
          height={150}
          className="pointer-events-none absolute bottom-12 right-8 z-10 hidden w-28 animate-[float_6s_ease-in-out_infinite] drop-shadow-xl lg:block"
        />

        <div className="relative z-10 w-full px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-2xl text-center sm:mx-0 sm:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Northern California
            </p>
            <h1 className="mb-5 text-[2.25rem] font-bold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05] lg:text-7xl">
              Book trusted cleaners{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-400 bg-clip-text text-transparent">
                in minutes.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-neutral-600 sm:mx-0 sm:text-xl">
              GPS check-in/out, before &amp; after photos, and payment released only after you
              approve.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-premium px-8 text-base font-semibold text-navy-950 shadow-tier2 transition-all duration-control hover:shadow-tier3 hover:brightness-105 active:scale-[0.98] sm:h-14"
              >
                Book a Cleaning <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white/80 px-8 text-base font-medium text-neutral-700 backdrop-blur-sm transition-all duration-control hover:border-brand-400 hover:text-brand-700 sm:h-14"
              >
                Browse Cleaners
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUBBLES BG WRAPS EVERYTHING BELOW HERO (the "merge" texture) ── */}
      <div
        className="relative"
        style={{
          backgroundImage: 'url(/brand/home-sections-bg.jpg)',
          backgroundSize: '100% auto',
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'top center',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/60" aria-hidden="true" />
        <div className="relative">
          {/* ── PROOF BAR ───────────────────────────────────────────── */}
          <section className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-600 to-accent-400 py-5 sm:py-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <div className="relative mx-auto max-w-6xl px-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
                {PROOF_BAR.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center gap-2 text-white sm:gap-3"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                    <span className="text-center text-[11px] font-semibold leading-tight sm:text-left sm:text-sm">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHY PURETASK FEELS SAFER ────────────────────────────── */}
          <section className="px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center sm:mb-14">
                <span className="mb-4 inline-block rounded-full border border-accent-400/30 bg-accent-400/15 px-3 py-1 text-xs font-semibold text-brand-900">
                  Why PureTask
                </span>
                <h2 className="mb-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                  Why PureTask feels safer than traditional booking
                </h2>
                <p className="mx-auto max-w-2xl text-base text-neutral-500 sm:text-xl">
                  We rebuilt the cleaning experience from scratch — transparency, accountability,
                  and your protection come first.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {WHY_SAFER.map((item) => (
                  <div
                    key={item.title}
                    className="h-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-tier1 transition-shadow duration-card hover:shadow-tier2 sm:p-8"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${item.tile} sm:h-14 sm:w-14`}
                    >
                      <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-neutral-900 sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-500 sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS — 4 STEPS ──────────────────────────────── */}
          <section className="px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center sm:mb-14">
                <span className="mb-4 inline-block rounded-full border border-accent-400/30 bg-accent-400/15 px-3 py-1 text-xs font-semibold text-brand-900">
                  Simple Process
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                  How it works in 4 steps
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                {STEPS.map((s) => (
                  <div key={s.step} className="relative text-center sm:text-left">
                    <div className="mb-2 text-4xl font-bold leading-none text-brand-600/25 sm:text-6xl">
                      {s.step}
                    </div>
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 shadow-tier1 sm:mx-0 sm:h-12 sm:w-12">
                      <s.icon className="h-5 w-5 text-brand-600 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-neutral-900 sm:text-xl">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-500 sm:text-base">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ────────────────────────────────────────── */}
          <section className="px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <span className="mb-4 inline-block rounded-full border border-accent-400/30 bg-accent-400/15 px-3 py-1 text-xs font-semibold text-brand-900">
                  What People Say
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                  Hear from our community
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-tier1"
                  >
                    <Quote className="mb-4 h-8 w-8 text-accent-400" />
                    <p className="mb-5 text-sm leading-relaxed text-neutral-700">{t.quote}</p>
                    <p className="font-semibold text-neutral-900">{t.name}</p>
                    <p className="text-sm text-neutral-500">{t.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FOUNDER NOTE ────────────────────────────────────────── */}
          <section className="px-6 py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <Quote className="mx-auto mb-6 h-10 w-10 text-accent-400/60 sm:h-12 sm:w-12" />
              <p className="mb-8 text-lg italic leading-relaxed text-neutral-800 sm:text-2xl">
                We built PureTask because we were tired of the same old booking experience — no
                transparency, no accountability, and no way to know if the job was actually done
                well. So we started from scratch. GPS tracking, photo proof, approval-gated payment.
                Every feature exists because we asked: &ldquo;Would this make us trust a stranger in
                our home?&rdquo;
              </p>
              <p className="font-bold text-brand-900 sm:text-lg">The PureTask Team</p>
              <p className="text-sm text-neutral-500">
                Building a cleaning platform we&apos;d actually want to use.
              </p>
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden px-6 py-16 sm:py-24">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-transparent to-accent-400/5" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="mb-5 text-3xl font-bold text-neutral-900 sm:text-5xl">
                Ready to try a{' '}
                <span className="bg-gradient-to-r from-brand-600 to-accent-400 bg-clip-text text-transparent">
                  better way to book?
                </span>
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base text-neutral-500 sm:text-xl">
                Transparent, verified, and built around your peace of mind.
              </p>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-premium px-8 text-base font-semibold text-navy-950 shadow-tier2 transition-all duration-control hover:shadow-tier3 hover:brightness-105 active:scale-[0.98] sm:h-14"
                >
                  Book Your First Clean <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/for-cleaners"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-green-600 px-8 text-base font-medium text-green-700 transition-colors hover:bg-green-50 sm:h-14"
                >
                  Earn as a Cleaner
                </Link>
              </div>
              <p className="mt-6 text-xs text-neutral-500 sm:text-sm">
                No credit card required · Background-checked cleaners · Pay only when you approve
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
