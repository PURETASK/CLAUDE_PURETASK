'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const SERVICE_OPTIONS = [
  { value: '', label: 'All services' },
  { value: 'standard', label: 'Standard clean' },
  { value: 'deep', label: 'Deep clean' },
  { value: 'move_out', label: 'Move-out clean' },
  { value: 'airbnb', label: 'Airbnb turnover' },
];

export const CleanerFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [zip, setZip] = useState(searchParams.get('zip') ?? '');
  const [service, setService] = useState(searchParams.get('service') ?? '');

  useEffect(() => {
    const params = new URLSearchParams();
    if (zip.trim()) params.set('zip', zip.trim());
    if (service) params.set('service', service);
    router.replace(`/app/cleaners?${params.toString()}`);
  }, [zip, service, router]);

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Filter by ZIP"
        maxLength={5}
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        className="w-32 rounded border px-3 py-2 text-sm"
      />
      <select
        value={service}
        onChange={(e) => setService(e.target.value)}
        className="rounded border px-3 py-2 text-sm"
      >
        {SERVICE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};
