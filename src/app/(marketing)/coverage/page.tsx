import Image from 'next/image';
import type { Metadata } from 'next';
import Link from 'next/link';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BACKGROUNDS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Where We Operate | PureTask',
  description: 'PureTask is live in Sacramento and expanding to the Bay Area and beyond.',
};

export const revalidate = 3600;

const CoveragePage = async () => {
  const supabase = await createSupabaseServerClient();

  const { data: areas } = await supabase
    .from('serviced_areas')
    .select('id, city, state, zip_code, status, seo_metro_area, seo_neighborhood_name')
    .order('city');

  const byStatus = {
    active: (areas ?? []).filter((a) => a.status === 'active'),
    seo_only: (areas ?? []).filter((a) => a.status === 'seo_only'),
    waitlist: (areas ?? []).filter((a) => a.status === 'waitlist'),
  };

  const activeMetros = [...new Set(byStatus.active.map((a) => a.seo_metro_area ?? a.city))];
  const soonMetros = [...new Set(byStatus.seo_only.map((a) => a.seo_metro_area ?? a.city))];
  const waitlistMetros = [...new Set(byStatus.waitlist.map((a) => a.seo_metro_area ?? a.city))];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src={BACKGROUNDS.findCity}
          alt="PureTask coverage map"
          width={1400}
          height={480}
          className="h-56 w-full object-cover sm:h-72"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-900/50 to-neutral-900/80" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-2xl px-6 pb-10 text-center">
            <h1 className="text-3xl font-bold text-white">Where we operate</h1>
            <p className="mt-2 text-neutral-300">
              PureTask is growing — here&apos;s where you can book today and what&apos;s coming next.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12 space-y-10">

        {activeMetros.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <span className="rounded-full bg-success/10 px-3 py-0.5 text-sm font-medium text-success-dark">
                Live now
              </span>
            </h2>
            <div className="grid gap-3">
              {activeMetros.map((metro) => (
                <div
                  key={metro}
                  className="flex items-center justify-between rounded-2xl border border-success/30 bg-success-light p-5"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">{metro}</p>
                    <p className="text-sm text-neutral-600">Available now — book instantly</p>
                  </div>
                  <Link
                    href="/browse"
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Book now
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {soonMetros.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Launching soon</h2>
            <div className="grid gap-3">
              {soonMetros.map((metro) => (
                <div
                  key={metro}
                  className="flex items-center justify-between rounded-2xl border border-warning/30 bg-warning/5 p-5"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">{metro}</p>
                    <p className="text-sm text-neutral-600">Q2 2026</p>
                  </div>
                  <Link
                    href={`/waitlist?city=${encodeURIComponent(metro)}`}
                    className="rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-600/5"
                  >
                    Join waitlist
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {waitlistMetros.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Future expansion</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {waitlistMetros.map((metro) => (
                <Link
                  key={metro}
                  href={`/waitlist?city=${encodeURIComponent(metro)}`}
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 hover:border-brand-600/30 hover:bg-brand-600/5"
                >
                  <p className="font-medium text-neutral-900">{metro}</p>
                  <span className="text-xs text-brand-600">Join waitlist →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-tier1">
          <p className="font-semibold text-neutral-900">Don&apos;t see your city?</p>
          <p className="mt-1 text-sm text-neutral-600">
            Join the waitlist and we&apos;ll notify you the day we launch in your area.
          </p>
          <Link
            href="/waitlist"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Join the waitlist
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CoveragePage;
