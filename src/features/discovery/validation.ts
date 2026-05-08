import { z } from 'zod';

const serviceKey = z.enum(['standard', 'deep', 'move_out', 'airbnb']);

export type BrowseSearchInput = {
  services: z.infer<typeof serviceKey>[];
  max_miles: 5 | 10 | 15 | 25;
  min_rating: 0 | 4.5 | 4.7 | 4.9;
  min_rate?: number;
  max_rate?: number;
  availability?: string;
  sort: 'match' | 'distance' | 'rating' | 'price';
};

const toServices = (raw: Record<string, string | string[] | undefined>): string[] => {
  const v = raw['service'];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v) return [v];
  return [];
};

export const parseBrowseSearchParams = (
  raw: Record<string, string | string[] | undefined>,
): BrowseSearchInput => {
  const pick = (key: string): string | undefined => {
    const v = raw[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const servicesParsed = z.array(serviceKey).safeParse(toServices(raw));
  const services = servicesParsed.success ? servicesParsed.data : [];

  const maxParsed = z.coerce.number().safeParse(pick('max_miles'));
  const max_miles = (
    maxParsed.success && [5, 10, 15, 25].includes(maxParsed.data) ? maxParsed.data : 25
  ) as BrowseSearchInput['max_miles'];

  const minR = z.coerce.number().safeParse(pick('min_rating'));
  const min_rating = (
    minR.success && [0, 4.5, 4.7, 4.9].includes(minR.data) ? minR.data : 0
  ) as BrowseSearchInput['min_rating'];

  const sortParsed = z.enum(['match', 'distance', 'rating', 'price']).safeParse(pick('sort'));
  const sort = sortParsed.success ? sortParsed.data : 'match';

  const min_rateV = z.coerce.number().int().nonnegative().safeParse(pick('min_rate'));
  const max_rateV = z.coerce.number().int().nonnegative().safeParse(pick('max_rate'));

  return {
    services,
    max_miles,
    min_rating,
    min_rate: min_rateV.success ? min_rateV.data : undefined,
    max_rate: max_rateV.success ? max_rateV.data : undefined,
    availability: pick('availability'),
    sort,
  };
};
