import { differenceInCalendarDays } from 'date-fns';

export type DiscoveryTier =
  | 'rising_pro'
  | 'proven_specialist'
  | 'top_performer'
  | 'all_star_expert';

export type MatchTransparencyFactor = {
  key: string;
  label: string;
  strength: 'high' | 'medium' | 'low';
  blurb: string;
};

/** Public transparency payload — never ships internal weights/multipliers/constants. */
export type MatchTransparency = {
  displayScore: number;
  factors: MatchTransparencyFactor[];
};

export type MatchScoreContext = {
  distanceMiles: number | null;
  currentTier: DiscoveryTier;
  customerWantsBookingSoon: boolean;
  servesCustomerZip: boolean;
  cleanerSpecialtyKeys: string[];
  requestedServiceKeys: string[];
  completedBookingCount: number;
  cleanerSinceAt: string;
};

const RAW_NORMALIZER = 2.34;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const distanceComponent = (miles: number | null): number => {
  if (miles == null || Number.isNaN(miles)) return 0;
  if (miles >= 25) return 0;
  return clamp01(1 - miles / 25);
};

export const tierComponent = (tier: DiscoveryTier): number => {
  const map: Record<DiscoveryTier, number> = {
    rising_pro: 0.5,
    proven_specialist: 0.75,
    top_performer: 0.9,
    all_star_expert: 1,
  };
  return map[tier];
};

export const SERVICE_TO_SPECIALTY_KEY: Record<string, string> = {
  deep: 'deep_clean_specialist',
  move_out: 'move_out_specialist',
  airbnb: 'airbnb_specialist',
};

export const availabilityMultiplier = (): number => 1;

export const zipFitMultiplier = (servesZip: boolean): number => (servesZip ? 1.5 : 1);

export const specialtyMultiplier = (
  requestedServiceKeys: string[],
  specialtyKeys: string[],
): number => {
  const needed = requestedServiceKeys
    .map((k) => SERVICE_TO_SPECIALTY_KEY[k])
    .filter((x): x is string => Boolean(x));

  if (needed.length === 0) return 1;

  const set = new Set(specialtyKeys);
  const hit = needed.some((nk) => set.has(nk));
  return hit ? 1.2 : 1;
};

export const coldStartMultiplier = (completedJobs: number, cleanerSinceIso: string): number => {
  const daysLive = differenceInCalendarDays(new Date(), new Date(cleanerSinceIso));
  if (completedJobs >= 10) return 1;
  if (daysLive > 60) return 1;
  return 1.3;
};

export const rawMatchScore = (ctx: MatchScoreContext): number => {
  const dist = distanceComponent(ctx.distanceMiles);
  const tier = tierComponent(ctx.currentTier);
  const availability = clamp01(ctx.customerWantsBookingSoon ? 1 : 1);
  const base = dist * 0.4 + tier * 0.3 + availability * 0.3;
  return (
    base *
    zipFitMultiplier(ctx.servesCustomerZip) *
    specialtyMultiplier(ctx.requestedServiceKeys, ctx.cleanerSpecialtyKeys) *
    coldStartMultiplier(ctx.completedBookingCount, ctx.cleanerSinceAt)
  );
};

export const toDisplayScore = (raw: number): number =>
  Math.round(Math.max(0, Math.min(100, (raw / RAW_NORMALIZER) * 100)));

const bucketStrength = (
  value: number,
  highFrom: number,
  medFrom: number,
): 'high' | 'medium' | 'low' => {
  if (value >= highFrom) return 'high';
  if (value >= medFrom) return 'medium';
  return 'low';
};

export const computeMatchTransparency = (ctx: MatchScoreContext): MatchTransparency => {
  const raw = rawMatchScore(ctx);
  const displayScore = toDisplayScore(raw);

  const dist = distanceComponent(ctx.distanceMiles);
  const tier = tierComponent(ctx.currentTier);
  const serves = ctx.servesCustomerZip;

  const specKeys = ctx.requestedServiceKeys
    .map((k) => SERVICE_TO_SPECIALTY_KEY[k])
    .filter((x): x is string => Boolean(x));
  const hasSpecHit = specKeys.some((sk) => ctx.cleanerSpecialtyKeys.includes(sk));
  const isCold = coldStartMultiplier(ctx.completedBookingCount, ctx.cleanerSinceAt) > 1;

  const factors: MatchTransparencyFactor[] = [
    {
      key: 'proximity',
      label: 'Proximity',
      strength: bucketStrength(dist, 0.66, 0.33),
      blurb:
        ctx.distanceMiles == null
          ? 'Distance will appear once addresses are fully geocoded.'
          : dist >= 0.66
            ? 'Close to your home — quick arrival.'
            : dist >= 0.33
              ? 'Moderate commute from your address.'
              : 'Farther away for this search.',
    },
    {
      key: 'tier',
      label: 'Cleaner level',
      strength: bucketStrength(tier, 0.86, 0.65),
      blurb:
        tier >= 0.86
          ? 'Very experienced tier with strong platform standing.'
          : tier >= 0.65
            ? 'Solid track record inside PureTask.'
            : 'Building reputation — often great value.',
    },
    {
      key: 'availability_alignment',
      label: 'Schedule fit',
      strength: 'medium',
      blurb:
        'We’ll refine this once live calendars arrive — for now availability is neutral in ranking.',
    },
    {
      key: 'local_fit',
      label: 'Neighborhood familiarity',
      strength: serves ? 'high' : 'low',
      blurb: serves
        ? 'Listed as serving neighborhoods near your ZIP.'
        : 'Not currently focused on your ZIP.',
    },
    {
      key: 'service_fit',
      label: 'Service fit',
      strength: specKeys.length === 0 ? 'medium' : hasSpecHit ? 'high' : 'low',
      blurb:
        specKeys.length === 0
          ? 'Broad services — compare profiles for the expertise you care about.'
          : hasSpecHit
            ? 'Earned specialties line up with the cleaning type you filtered.'
            : 'No overlapping specialty badges for this cleaning type.',
    },
    {
      key: 'new_pro_boost',
      label: 'New Pro visibility',
      strength: isCold ? 'high' : 'low',
      blurb: isCold
        ? 'Recently approved with fewer bookings — boosted so great new cleaners surface.'
        : 'Established workload — standard visibility.',
    },
  ];

  return { displayScore, factors };
};

export const TIER_LABELS: Record<DiscoveryTier, string> = {
  rising_pro: 'Rising Pro',
  proven_specialist: 'Proven Specialist',
  top_performer: 'Top Performer',
  all_star_expert: 'All-Star Expert',
};

export const TIER_COLORS: Record<DiscoveryTier, { bg: string; text: string }> = {
  rising_pro: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
  proven_specialist: { bg: 'bg-blue-50', text: 'text-blue-700' },
  top_performer: { bg: 'bg-amber-50', text: 'text-amber-700' },
  all_star_expert: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};
