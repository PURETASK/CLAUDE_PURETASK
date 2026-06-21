'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils/cn';

const SORTS = [
  { value: 'match', label: 'Best match' },
  { value: 'distance', label: 'Distance' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Top rated' },
];

const SERVICE_OPTIONS = [
  { value: 'standard', label: 'Standard clean' },
  { value: 'deep', label: 'Deep clean' },
  { value: 'move_out', label: 'Move-out clean' },
  { value: 'airbnb', label: 'Airbnb turnover' },
];

export const CleanerFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [service, setService] = useState(searchParams.get('service') ?? '');
  const [maxMiles, setMaxMiles] = useState(searchParams.get('max_miles') ?? '25');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') ?? '0');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'match');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (maxMiles && maxMiles !== '25') params.set('max_miles', maxMiles);
    if (minRating && minRating !== '0') params.set('min_rating', minRating);
    if (sort && sort !== 'match') params.set('sort', sort);
    router.replace(`/app/cleaners?${params.toString()}`);
  }, [service, maxMiles, minRating, sort, router]);

  const activeFilterCount =
    (service ? 1 : 0) + (maxMiles !== '25' ? 1 : 0) + (minRating !== '0' ? 1 : 0);

  const chip = (active: boolean) =>
    cn(
      'flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'bg-brand-600 text-white'
        : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSort(s.value)}
            className={chip(sort === s.value)}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border border-brand-200 bg-brand-50 text-brand-700'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
          Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:grid-cols-3">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="pt-field w-full"
            aria-label="Service type"
          >
            <option value="">All services</option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={maxMiles}
            onChange={(e) => setMaxMiles(e.target.value)}
            className="pt-field w-full"
            aria-label="Maximum distance"
          >
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="15">Within 15 miles</option>
            <option value="25">Within 25 miles</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="pt-field w-full"
            aria-label="Minimum rating"
          >
            <option value="0">All ratings</option>
            <option value="4.5">4.5+ stars</option>
            <option value="4.7">4.7+ stars</option>
            <option value="4.9">4.9+ stars</option>
          </select>
        </div>
      )}
    </div>
  );
};
