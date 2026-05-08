export type BookingPricing = {
  cleanerSubtotalCents: number;
  platformFeeCents: number;
  totalChargeCents: number;
  cleanerPayoutCents: number;
  commissionRate: number;
};

export type TierName = 'rising_pro' | 'proven_specialist' | 'top_performer' | 'all_star_expert';

export const TIER_COMMISSION_RATES: Record<TierName, number> = {
  rising_pro: 0.15,
  proven_specialist: 0.13,
  top_performer: 0.11,
  all_star_expert: 0.1,
};

export const RISING_PRO_INTRO_RATE = 0.12;
export const RISING_PRO_INTRO_JOB_LIMIT = 6;

export const COMMISSION_RATE = 0.2;

export const getCommissionRate = (tier: TierName, completedBookingCount: number): number => {
  if (tier === 'rising_pro' && completedBookingCount < RISING_PRO_INTRO_JOB_LIMIT) {
    return RISING_PRO_INTRO_RATE;
  }
  return TIER_COMMISSION_RATES[tier];
};

export const computeBookingPricing = (
  hourlyRateCents: number,
  durationHours: number,
  commissionRate = COMMISSION_RATE,
): BookingPricing => {
  const cleanerSubtotalCents = hourlyRateCents * durationHours;
  const platformFeeCents = Math.round(cleanerSubtotalCents * commissionRate);
  const totalChargeCents = cleanerSubtotalCents + platformFeeCents;
  const cleanerPayoutCents = cleanerSubtotalCents;
  return {
    cleanerSubtotalCents,
    platformFeeCents,
    totalChargeCents,
    cleanerPayoutCents,
    commissionRate,
  };
};
