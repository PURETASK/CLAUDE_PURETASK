export const COMMISSION_RATE = 0.2;

export type BookingPricing = {
  hourlyRateCents: number;
  cleanerSubtotalCents: number;
  platformFeeCents: number;
  totalChargeCents: number;
  cleanerPayoutCents: number;
  commissionRate: number;
};

export const computeBookingPricing = (
  hourlyRateCents: number,
  durationHours: number,
): BookingPricing => {
  const cleanerSubtotalCents = hourlyRateCents * durationHours;
  const platformFeeCents = Math.round(cleanerSubtotalCents * COMMISSION_RATE);
  const totalChargeCents = cleanerSubtotalCents + platformFeeCents;
  return {
    hourlyRateCents,
    cleanerSubtotalCents,
    platformFeeCents,
    totalChargeCents,
    cleanerPayoutCents: cleanerSubtotalCents,
    commissionRate: COMMISSION_RATE,
  };
};

export const generateBookingNumber = (year: number, randomInt: number): string => {
  const rand = randomInt.toString().padStart(6, '0');
  return `PT-${year}-${rand}`;
};
