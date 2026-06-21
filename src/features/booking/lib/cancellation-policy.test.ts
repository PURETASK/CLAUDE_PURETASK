import { describe, expect, it } from 'vitest';

import { calculateCancellationPenalty } from './cancellation-policy';

const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
const TOTAL = 10_000; // $100.00

describe('calculateCancellationPenalty', () => {
  describe('free window (>= 48h before start)', () => {
    it('72h out → full refund, no penalty', () => {
      const r = calculateCancellationPenalty(hoursFromNow(72), TOTAL);
      expect(r.tier).toBe('free');
      expect(r.penaltyCents).toBe(0);
      expect(r.refundCents).toBe(TOTAL);
    });
    it('just over 48h → still free', () => {
      expect(calculateCancellationPenalty(hoursFromNow(49), TOTAL).tier).toBe('free');
    });
  });

  describe('partial window (24h–48h)', () => {
    it('36h out → 50% penalty / 50% refund', () => {
      const r = calculateCancellationPenalty(hoursFromNow(36), TOTAL);
      expect(r.tier).toBe('partial');
      expect(r.penaltyCents).toBe(5_000);
      expect(r.refundCents).toBe(5_000);
    });
    it('penalty + refund always sum to the total', () => {
      const r = calculateCancellationPenalty(hoursFromNow(30), TOTAL);
      expect(r.penaltyCents + r.refundCents).toBe(TOTAL);
    });
    it('rounds the 50% penalty (odd total)', () => {
      const r = calculateCancellationPenalty(hoursFromNow(30), 101);
      expect(r.penaltyCents).toBe(51); // round(50.5)
      expect(r.refundCents).toBe(50);
      expect(r.penaltyCents + r.refundCents).toBe(101);
    });
    it('just under 48h is partial, just over 24h is partial', () => {
      expect(calculateCancellationPenalty(hoursFromNow(47), TOTAL).tier).toBe('partial');
      expect(calculateCancellationPenalty(hoursFromNow(25), TOTAL).tier).toBe('partial');
    });
  });

  describe('full-penalty window (< 24h)', () => {
    it('12h out → no refund, full penalty', () => {
      const r = calculateCancellationPenalty(hoursFromNow(12), TOTAL);
      expect(r.tier).toBe('full');
      expect(r.penaltyCents).toBe(TOTAL);
      expect(r.refundCents).toBe(0);
    });
    it('after the start time (negative hours) → full penalty', () => {
      const r = calculateCancellationPenalty(hoursFromNow(-3), TOTAL);
      expect(r.tier).toBe('full');
      expect(r.refundCents).toBe(0);
    });
  });

  it('never refunds more than the total or less than zero', () => {
    for (const h of [-5, 1, 23, 24, 30, 47, 48, 72]) {
      const r = calculateCancellationPenalty(hoursFromNow(h), TOTAL);
      expect(r.refundCents).toBeGreaterThanOrEqual(0);
      expect(r.refundCents).toBeLessThanOrEqual(TOTAL);
      expect(r.penaltyCents).toBeGreaterThanOrEqual(0);
    }
  });
});
