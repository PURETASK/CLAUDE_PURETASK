import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

import { ICONS } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Cleaner Specialties | PureTask',
  description: 'PureTask cleaners earn specialty endorsements based on verified customer feedback.',
};

const SPECIALTIES = [
  {
    icon: ICONS.cleaning,
    label: 'Eco-Friendly',
    description: 'Uses green cleaning products only. Earned after 15+ customers tag them "eco-friendly."',
  },
  {
    icon: ICONS.contacts,
    label: 'Pet-Friendly',
    description: 'Comfortable around pets and knows how to clean pet hair, odors, and dander. 15+ "pet-friendly" tags.',
  },
  {
    icon: ICONS.home,
    label: 'Deep Clean Expert',
    description: 'Goes beyond surface cleaning every time. Earned from 15+ "thorough" and "detail-oriented" tags.',
  },
  {
    icon: ICONS.calendar,
    label: 'Move-Out Specialist',
    description: 'Experience with move-out cleans that pass landlord inspections. 15+ move-out bookings at 4.5+.',
  },
  {
    icon: ICONS.cleaning2,
    label: 'Airbnb Ready',
    description: 'Fast, reliable turnovers between guests. 15+ Airbnb bookings completed with 4.7+ rating.',
  },
] as const;

const SpecialtiesPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← Home
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-tier2 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
            <Image src={ICONS.cleaning2} alt="" width={44} height={44} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Specialty Endorsements</h1>
          <p className="mt-2 text-neutral-600">
            Earned automatically from verified customer feedback — never self-reported.
          </p>
        </div>

        <div className="space-y-3">
          {SPECIALTIES.map(({ icon, label, description }) => (
            <div
              key={label}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <Image src={icon} alt="" width={26} height={26} className="object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{label}</p>
                  <p className="mt-1 text-sm text-neutral-600">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-100 p-5 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Updated nightly</p>
          <p className="mt-1">
            Specialty badges are recalculated each night based on the latest reviews. Cleaners who
            no longer meet the threshold lose the badge automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpecialtiesPage;
