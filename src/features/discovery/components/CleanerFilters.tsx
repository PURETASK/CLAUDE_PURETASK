'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const params = new URLSearchParams();
    if (service) params.set('service', service);
    if (maxMiles && maxMiles !== '25') params.set('max_miles', maxMiles);
    if (minRating && minRating !== '0') params.set('min_rating', minRating);
    if (sort && sort !== 'match') params.set('sort', sort);
    router.replace(`/app/cleaners?${params.toString()}`);
  }, [service, maxMiles, minRating, sort, router]);

  const selectClass = 'pt-field w-auto';

  return (
    <div className="flex flex-wrap gap-3">
      <select value={service} onChange={(e) => setService(e.target.value)} className={selectClass}>
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
        className={selectClass}
      >
        <option value="5">Within 5 miles</option>
        <option value="10">Within 10 miles</option>
        <option value="15">Within 15 miles</option>
        <option value="25">Within 25 miles</option>
      </select>
      <select
        value={minRating}
        onChange={(e) => setMinRating(e.target.value)}
        className={selectClass}
      >
        <option value="0">All ratings</option>
        <option value="4.5">4.5+ stars</option>
        <option value="4.7">4.7+ stars</option>
        <option value="4.9">4.9+ stars</option>
      </select>
      <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
        <option value="match">Sort: Match score</option>
        <option value="distance">Sort: Distance</option>
        <option value="rating">Sort: Rating</option>
        <option value="price">Sort: Price</option>
      </select>
    </div>
  );
};
