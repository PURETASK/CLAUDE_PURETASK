import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ICONS, BACKGROUNDS } from '@/lib/assets';

const CITIES: Record<string, { label: string; state: string; zips: string[] }> = {
  sacramento: {
    label: 'Sacramento',
    state: 'CA',
    zips: [
      '95814',
      '95816',
      '95818',
      '95820',
      '95822',
      '95823',
      '95825',
      '95826',
      '95828',
      '95831',
      '95832',
      '95833',
      '95834',
      '95835',
      '95838',
    ],
  },
  'san-francisco': {
    label: 'San Francisco',
    state: 'CA',
    zips: [
      '94102',
      '94103',
      '94107',
      '94110',
      '94112',
      '94114',
      '94115',
      '94117',
      '94121',
      '94122',
      '94123',
      '94124',
      '94127',
      '94131',
      '94132',
      '94133',
      '94134',
    ],
  },
  oakland: {
    label: 'Oakland',
    state: 'CA',
    zips: [
      '94601',
      '94602',
      '94603',
      '94605',
      '94606',
      '94607',
      '94608',
      '94609',
      '94610',
      '94611',
      '94612',
      '94619',
      '94621',
    ],
  },
  'san-jose': {
    label: 'San Jose',
    state: 'CA',
    zips: [
      '95101',
      '95110',
      '95112',
      '95116',
      '95117',
      '95118',
      '95119',
      '95120',
      '95121',
      '95122',
      '95123',
      '95124',
      '95125',
      '95126',
      '95128',
    ],
  },
  berkeley: {
    label: 'Berkeley',
    state: 'CA',
    zips: ['94702', '94703', '94704', '94705', '94706', '94707', '94708', '94709', '94710'],
  },
  'elk-grove': { label: 'Elk Grove', state: 'CA', zips: ['95624', '95757', '95758', '95759'] },
  roseville: { label: 'Roseville', state: 'CA', zips: ['95661', '95678', '95747'] },
  folsom: { label: 'Folsom', state: 'CA', zips: ['95630'] },
};

const SERVICES: Record<
  string,
  { label: string; description: string; includes: string[]; duration: string }
> = {
  standard: {
    label: 'Standard Cleaning',
    description:
      'A thorough recurring clean of your home — vacuuming, mopping, dusting, kitchen and bathrooms.',
    includes: [
      'Vacuum all rooms',
      'Mop hard floors',
      'Dust surfaces',
      'Clean kitchen counters & appliances',
      'Scrub bathrooms',
      'Empty trash',
    ],
    duration: '2–4 hours depending on size',
  },
  deep: {
    label: 'Deep Cleaning',
    description:
      'A top-to-bottom intensive clean that reaches areas standard cleans skip — inside appliances, baseboards, behind furniture.',
    includes: [
      'Everything in Standard',
      'Inside oven & refrigerator',
      'Baseboards & window sills',
      'Cabinet interiors',
      'Behind & under furniture',
      'Light fixtures & ceiling fans',
    ],
    duration: '4–8 hours depending on size',
  },
  'move-out': {
    label: 'Move-Out Cleaning',
    description:
      'Restore your home to pristine condition for landlords and new tenants. Ideal for end-of-lease cleans.',
    includes: [
      'Full deep clean of empty property',
      'Inside all cabinets & drawers',
      'Full appliance cleaning',
      'Window tracks & sills',
      'Wall spot-cleaning',
      'Garage sweep (if applicable)',
    ],
    duration: '5–10 hours depending on size',
  },
  airbnb: {
    label: 'Airbnb / Short-Term Rental',
    description:
      'Fast, reliable turnovers between guests with hotel-quality standards and linen management.',
    includes: [
      'Full room reset',
      'Linen change & remade beds',
      'Bathroom restock & clean',
      'Kitchen clean & restock',
      'Trash removal',
      'Guest-ready inspection',
    ],
    duration: '1–3 hours per turnover',
  },
  'house-cleaning': {
    label: 'House Cleaning',
    description: 'Full-service house cleaning for any size home — inside and out.',
    includes: [
      'Vacuum all rooms',
      'Mop hard floors',
      'Dust surfaces',
      'Clean kitchen counters & appliances',
      'Scrub bathrooms',
      'Empty trash',
    ],
    duration: '2–4 hours depending on size',
  },
  'deep-cleaning': {
    label: 'Deep Cleaning',
    description: 'A comprehensive deep clean for a truly fresh start.',
    includes: [
      'Everything in standard cleaning',
      'Inside oven & refrigerator',
      'Interior cabinets & drawers',
      'Light fixtures & ceiling fans',
      'Window sills & door frames',
      'Behind & under furniture',
    ],
    duration: '4–8 hours depending on size',
  },
  'move-out-cleaning': {
    label: 'Move-Out Cleaning',
    description: 'Landlord inspection-ready cleaning for end-of-lease.',
    includes: [
      'Full deep clean of all rooms',
      'Inside all cabinets & closets',
      'Walls & light switches',
      'Garage sweep',
      'Landlord inspection ready',
    ],
    duration: '5–10 hours depending on size',
  },
  'airbnb-cleaning': {
    label: 'Airbnb Cleaning',
    description: 'Quick, reliable turnovers with photo proof every time.',
    includes: [
      'Turnover between guests',
      'Fresh linens & made beds',
      'Restock guest amenities',
      'Photo proof of every room',
      'Fast 2–4 hour turnaround',
    ],
    duration: '1–3 hours per turnover',
  },
};

const FAQ = [
  {
    q: 'Are all cleaners background checked?',
    a: 'Yes — every PureTask cleaner passes a Checkr background check before their first job.',
  },
  {
    q: 'How is pricing determined?',
    a: 'Pricing is set per hour by each cleaner. You see the exact rate before booking — no surprises.',
  },
  {
    q: 'Can I request the same cleaner every time?',
    a: 'Absolutely. You can favorite any cleaner and rebook them directly with one tap.',
  },
  {
    q: "What if I'm not satisfied?",
    a: 'We have a 24-hour satisfaction guarantee. Open a dispute and our team reviews it the same day.',
  },
];

type Props = {
  params: Promise<{ city: string; service: string }>;
};

export async function generateStaticParams() {
  return Object.keys(CITIES).flatMap((city) =>
    Object.keys(SERVICES).map((service) => ({ city, service })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, service } = await params;
  const cityData = CITIES[city];
  const serviceData = SERVICES[service];
  if (!cityData || !serviceData) return {};

  const title = `${serviceData.label} in ${cityData.label}, ${cityData.state} | PureTask`;
  const description = `Book a trusted, background-checked cleaner for ${serviceData.label.toLowerCase()} in ${cityData.label}. Instant booking, live job tracking, satisfaction guarantee.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

async function getTopCleaners(zips: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, bio, profile_photo_url, average_rating, review_count, completed_booking_count,
       users!cleaner_profiles_user_id_fkey(full_name),
       cleaner_service_zips!inner(zip_code)`,
    )
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('cleaner_service_zips.zip_code', zips)
    .not('average_rating', 'is', null)
    .gte('average_rating', 4.5)
    .order('average_rating', { ascending: false })
    .limit(3);

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.id,
      name: (u as { full_name?: string } | null)?.full_name ?? 'Cleaner',
      bio: row.bio ?? null,
      photo: row.profile_photo_url ?? null,
      rating: row.average_rating ?? 0,
      reviewCount: row.review_count,
      jobCount: row.completed_booking_count,
    };
  });
}

export default async function CityServicePage({ params }: Props) {
  const { city, service } = await params;
  const cityData = CITIES[city];
  const serviceData = SERVICES[service];
  if (!cityData || !serviceData) notFound();

  const topCleaners = await getTopCleaners(cityData.zips);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-neutral-900">
        <Image src={BACKGROUNDS.bubbles} alt="" fill className="object-cover opacity-10" priority />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
            <Image src={ICONS.checkmark} alt="" width={16} height={16} />
            Background-checked cleaners only
          </div>
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {serviceData.label} in {cityData.label}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{serviceData.description}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/app/cleaners"
              className="rounded-xl bg-gradient-brand px-8 py-3.5 text-base font-semibold text-white shadow-tier2 transition-all hover:brightness-110"
            >
              Book a cleaner now
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12">
        {/* What's included */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">What&apos;s included</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {serviceData.includes.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-tier1"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/10">
                  <svg
                    className="h-3.5 w-3.5 text-brand-600"
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
          <p className="mt-3 text-sm text-neutral-500">Typical duration: {serviceData.duration}</p>
        </section>

        {/* Top cleaners in area */}
        {topCleaners.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-neutral-900">
              Top-rated cleaners in {cityData.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topCleaners.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/cleaners/${c.id}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 transition-all hover:shadow-tier2"
                >
                  <div className="mb-3 flex items-center gap-3">
                    {c.photo ? (
                      <Image
                        src={c.photo}
                        alt={c.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <Image
                        src={ICONS.contacts}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.jobCount} jobs completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {c.rating.toFixed(1)} · {c.reviewCount} reviews
                  </div>
                  {c.bio && <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{c.bio}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trust bar */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: ICONS.checkmark,
              title: 'Background checked',
              body: 'Every cleaner passes a Checkr background check before their first job.',
            },
            {
              icon: ICONS.home,
              title: 'Live job tracking',
              body: "Watch your cleaner's progress in real time with GPS and photo updates.",
            },
            {
              icon: ICONS.wallet,
              title: 'Satisfaction guarantee',
              body: "24-hour dispute window. We make it right or you don't pay.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1"
            >
              <Image
                src={item.icon}
                alt=""
                width={40}
                height={40}
                className="mb-3 drop-shadow-sm"
              />
              <p className="font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-500">{item.body}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1"
              >
                <p className="font-semibold text-neutral-900">{item.q}</p>
                <p className="mt-1.5 text-sm text-neutral-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="rounded-2xl bg-gradient-brand p-8 text-center text-white shadow-tier2">
          <h2 className="text-2xl font-bold">Book a cleaner in {cityData.label} today</h2>
          <p className="mt-2 text-white/80">Instant booking. No contracts. Cancel anytime.</p>
          <Link
            href="/app/cleaners"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-brand-700 shadow-tier1 transition-all hover:brightness-105"
          >
            Browse available cleaners
          </Link>
        </section>
      </div>
    </div>
  );
}
