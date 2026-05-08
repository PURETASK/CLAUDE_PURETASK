import { describe, expect, it } from 'vitest';

import {
  COMMISSION_RATE,
  RISING_PRO_INTRO_JOB_LIMIT,
  RISING_PRO_INTRO_RATE,
  TIER_COMMISSION_RATES,
  computeBookingPricing,
  getCommissionRate,
} from './pricing';

describe('computeBookingPricing', () => {
  it('default commission rate is 20%', () => {
    expect(COMMISSION_RATE).toBe(0.2);
  });

  it('calculates cleaner subtotal as rate × hours', () => {
    const { cleanerSubtotalCents } = computeBookingPricing(5000, 3);
    expect(cleanerSubtotalCents).toBe(15000);
  });

  it('platform fee is 20% of cleaner subtotal, rounded', () => {
    const { platformFeeCents } = computeBookingPricing(5000, 3);
    expect(platformFeeCents).toBe(3000); // 15000 * 0.20 = 3000
  });

  it('total charge is cleaner subtotal + platform fee', () => {
    const { totalChargeCents } = computeBookingPricing(5000, 3);
    expect(totalChargeCents).toBe(18000);
  });

  it('cleaner payout equals cleaner subtotal (no deduction)', () => {
    const { cleanerSubtotalCents, cleanerPayoutCents } = computeBookingPricing(5000, 3);
    expect(cleanerPayoutCents).toBe(cleanerSubtotalCents);
  });

  it('rounds platform fee correctly for non-integer cents', () => {
    // $33.33/hr × 1 hr = $33.33, fee = 0.20 × 3333 = 666.6 → rounds to 667
    const { platformFeeCents } = computeBookingPricing(3333, 1);
    expect(platformFeeCents).toBe(667);
  });

  it('respects a custom commission rate', () => {
    const { platformFeeCents } = computeBookingPricing(10000, 2, 0.15);
    expect(platformFeeCents).toBe(3000); // 20000 * 0.15 = 3000
  });

  it('handles 1-hour booking', () => {
    const result = computeBookingPricing(6000, 1);
    expect(result.cleanerSubtotalCents).toBe(6000);
    expect(result.platformFeeCents).toBe(1200);
    expect(result.totalChargeCents).toBe(7200);
  });

  it('handles 8-hour booking', () => {
    const result = computeBookingPricing(4500, 8);
    expect(result.cleanerSubtotalCents).toBe(36000);
    expect(result.platformFeeCents).toBe(7200);
    expect(result.totalChargeCents).toBe(43200);
  });

  it('total always equals subtotal + fee', () => {
    const rates = [4000, 5500, 7500, 9000];
    const hours = [1, 2, 4, 6, 8];
    for (const rate of rates) {
      for (const h of hours) {
        const { cleanerSubtotalCents, platformFeeCents, totalChargeCents } = computeBookingPricing(
          rate,
          h,
        );
        expect(totalChargeCents).toBe(cleanerSubtotalCents + platformFeeCents);
      }
    }
  });

  it('commissionRate is returned on the result object', () => {
    const { commissionRate } = computeBookingPricing(5000, 3, 0.13);
    expect(commissionRate).toBe(0.13);
  });
});

describe('getCommissionRate', () => {
  it('Rising Pro with < 6 jobs gets 12% intro rate', () => {
    expect(getCommissionRate('rising_pro', 0)).toBe(RISING_PRO_INTRO_RATE);
    expect(getCommissionRate('rising_pro', 5)).toBe(RISING_PRO_INTRO_RATE);
  });

  it('Rising Pro intro window ends exactly at job limit', () => {
    expect(getCommissionRate('rising_pro', RISING_PRO_INTRO_JOB_LIMIT - 1)).toBe(
      RISING_PRO_INTRO_RATE,
    );
    expect(getCommissionRate('rising_pro', RISING_PRO_INTRO_JOB_LIMIT)).toBe(
      TIER_COMMISSION_RATES.rising_pro,
    );
  });

  it('Rising Pro with >= 6 jobs gets 15%', () => {
    expect(getCommissionRate('rising_pro', 6)).toBe(0.15);
    expect(getCommissionRate('rising_pro', 50)).toBe(0.15);
  });

  it('Proven Specialist gets 13%', () => {
    expect(getCommissionRate('proven_specialist', 0)).toBe(0.13);
  });

  it('Top Performer gets 11%', () => {
    expect(getCommissionRate('top_performer', 100)).toBe(0.11);
  });

  it('All-Star Expert gets 10%', () => {
    expect(getCommissionRate('all_star_expert', 200)).toBe(0.1);
  });
});
