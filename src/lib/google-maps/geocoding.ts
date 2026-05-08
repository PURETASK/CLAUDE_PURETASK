import { env } from '@/lib/env';

type GeocodeResult = { lat: number; lng: number };

/**
 * Geocodes a US address line for marketplace distance search. Returns null on soft failure.
 * Never throws for network/parsing issues — callers enqueue retries separately.
 */
export const geocodeStructuredAddress = async (input: {
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country?: string;
}): Promise<GeocodeResult | null> => {
  const key = env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const address = [
    input.street1,
    input.street2 ?? '',
    input.city,
    input.state,
    input.zip,
    input.country ?? 'US',
  ]
    .filter(Boolean)
    .join(', ');

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);
  url.searchParams.set('region', 'us');

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      status?: string;
      results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
    };

    if (data.status !== 'OK' || !data.results?.length) return null;

    const loc = data.results[0]?.geometry?.location;
    if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return null;

    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
};
