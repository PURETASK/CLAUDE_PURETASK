export type BookingPricing = {
  cleanerSubtotalCents: number;
  platformFeeCents: number;
  totalChargeCents: number;
  cleanerPayoutCents: number;
};

export const COMMISSION_RATE = 0.2;

export const computeBookingPricing = (
  hourlyRateCents: number,
  durationHours: number,
  commissionRate = COMMISSION_RATE,
): BookingPricing => {
  const cleanerSubtotalCents = hourlyRateCents * durationHours;
  const platformFeeCents = Math.round(cleanerSubtotalCents * commissionRate);
  const totalChargeCents = cleanerSubtotalCents + platformFeeCents;
  const cleanerPayoutCents = cleanerSubtotalCents;
  return { cleanerSubtotalCents, platformFeeCents, totalChargeCents, cleanerPayoutCents };
};
