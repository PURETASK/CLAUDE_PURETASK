import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ city: string; service: string }>;
}

const CITIES = ['sacramento', 'elk-grove', 'roseville', 'folsom'];
const SERVICES = ['house-cleaning', 'deep-cleaning', 'move-out-cleaning', 'airbnb-cleaning'];

export async function generateStaticParams() {
  return CITIES.flatMap((city) => SERVICES.map((service) => ({ city, service })));
}

const formatSlug = (slug: string) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const SERVICE_INCLUDES: Record<string, string[]> = {
  'house-cleaning': [
    'Vacuum & mop all floors',
    'Clean kitchen surfaces & appliances',
    'Scrub bathrooms & fixtures',
    'Dust furniture & baseboards',
    'Empty trash bins',
  ],
  'deep-cleaning': [
    'Everything in standard cleaning',
    'Inside oven & refrigerator',
    'Interior cabinets & drawers',
    'Light fixtures & ceiling fans',
    'Window sills & door frames',
    'Behind & under furniture',
  ],
  'move-out-cleaning': [
    'Full deep clean of all rooms',
    'Inside all cabinets & closets',
    'Walls & light switches',
    'Garage sweep',
    'Landlord inspection ready',
  ],
  'airbnb-cleaning': [
    'Turnover between guests',
    'Fresh linens & made beds',
    'Restock guest amenities',
    'Photo proof of every room',
    'Fast 2–4 hour turnaround',
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, service } = await params;
  const cityName = formatSlug(city);
  const serviceName = formatSlug(service);
  return {
    title: `${serviceName} in ${cityName} | PureTask`,
    description: `Book trusted ${serviceName.toLowerCase()} in ${cityName}. Background-checked cleaners, photo proof, pay after approval.`,
  };
}

const CityServicePage = async ({ params }: Props) => {
  const { city, service } = await params;
  const cityName = formatSlug(city);
  const serviceName = formatSlug(service);
  const includes = SERVICE_INCLUDES[service] ?? SERVICE_INCLUDES['house-cleaning']!;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-tier2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{cityName}</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{serviceName}</h1>
          <p className="mt-2 text-neutral-600">
            Background-checked cleaners · Photo proof · Pay after approval
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Book a cleaner in {cityName}
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">What&apos;s included</h2>
          <ul className="space-y-2">
            {includes.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="text-success">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Verified cleaners', value: '100%', icon: '🛡' },
            { label: 'Avg rating', value: '4.8 ★', icon: '⭐' },
            { label: 'Satisfaction', value: '98%', icon: '✓' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1">
              <div className="mb-1 text-2xl">{icon}</div>
              <div className="text-xl font-bold text-neutral-900">{value}</div>
              <div className="text-xs text-neutral-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: `How much does ${serviceName.toLowerCase()} cost in ${cityName}?`,
                a: `Prices start at $40/hr with a 2-hour minimum. Exact price depends on your home size and cleaner's rate.`,
              },
              {
                q: 'Do I need to be home during the cleaning?',
                a: 'No — many customers provide access instructions. You get real-time updates and photo proof either way.',
              },
              {
                q: "What if I'm not happy with the clean?",
                a: "You approve the work before payment is released. If something isn't right, raise a dispute and we'll make it right.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-medium text-neutral-900">{q}</p>
                <p className="mt-1 text-sm text-neutral-600">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/browse"
            className="inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Find a {serviceName} cleaner in {cityName}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CityServicePage;
