import { describe, expect, it } from 'vitest';

import { COMMISSION_RATE, computeBookingPricing, generateBookingNumber } from './pricing';

describe('computeBookingPricing', () => {
  it('computes a basic 1-hour $50/hr booking', () => {
    const p = computeBookingPricing(5000, 1);
    expect(p.hourlyRateCents).toBe(5000);
    expect(p.cleanerSubtotalCents).toBe(5000);
    expect(p.platformFeeCents).toBe(1000);
    expect(p.totalChargeCents).toBe(6000);
    expect(p.cleanerPayoutCents).toBe(5000);
    expect(p.commissionRate).toBe(COMMISSION_RATE);
  });

  it('rounds platform fee to nearest cent (4 hr @ $33.33/hr)', () => {
    const p = computeBookingPricing(3333, 4);
    expect(p.cleanerSubtotalCents).toBe(13332);
    expect(p.platformFeeCents).toBe(Math.round(13332 * 0.2));
    expect(p.totalChargeCents).toBe(p.cleanerSubtotalCents + p.platformFeeCents);
  });

  it('total = subtotal + fee invariant holds for fractional durations', () => {
    const p = computeBookingPricing(4500, 2.5);
    expect(p.totalChargeCents).toBe(p.cleanerSubtotalCents + p.platformFeeCents);
  });

  it('cleaner payout always equals subtotal (full base, no fee deducted)', () => {
    const p = computeBookingPricing(7500, 3);
    expect(p.cleanerPayoutCents).toBe(p.cleanerSubtotalCents);
  });

  it('zero rate yields zero everywhere', () => {
    const p = computeBookingPricing(0, 4);
    expect(p.cleanerSubtotalCents).toBe(0);
    expect(p.platformFeeCents).toBe(0);
    expect(p.totalChargeCents).toBe(0);
    expect(p.cleanerPayoutCents).toBe(0);
  });
});

describe('generateBookingNumber', () => {
  it('formats as PT-YYYY-NNNNNN', () => {
    expect(generateBookingNumber(2026, 42)).toBe('PT-2026-000042');
  });

  it('pads to 6 digits', () => {
    expect(generateBookingNumber(2026, 1)).toBe('PT-2026-000001');
    expect(generateBookingNumber(2026, 999999)).toBe('PT-2026-999999');
  });
});
