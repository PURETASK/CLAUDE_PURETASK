import { describe, expect, it } from 'vitest';

import {
  coldStartMultiplier,
  computeMatchTransparency,
  distanceComponent,
  rawMatchScore,
  specialtyMultiplier,
  tierComponent,
  toDisplayScore,
  zipFitMultiplier,
} from './match-score';

describe('match-score', () => {
  it('distance component clamps at 0 beyond 25 miles', () => {
    expect(distanceComponent(0)).toBe(1);
    expect(distanceComponent(12.5)).toBe(0.5);
    expect(distanceComponent(25)).toBe(0);
    expect(distanceComponent(60)).toBe(0);
  });

  it('tier component follows expected progression', () => {
    expect(tierComponent('rising_pro')).toBeLessThan(tierComponent('proven_specialist'));
    expect(tierComponent('proven_specialist')).toBeLessThan(tierComponent('top_performer'));
    expect(tierComponent('top_performer')).toBeLessThan(tierComponent('all_star_expert'));
  });

  it('zip and specialty multipliers apply when matched', () => {
    expect(zipFitMultiplier(true)).toBeGreaterThan(zipFitMultiplier(false));
    expect(specialtyMultiplier(['deep'], ['deep_clean_specialist'])).toBeGreaterThan(
      specialtyMultiplier(['deep'], []),
    );
  });

  it('cold-start applies only for new / low-job cleaners', () => {
    expect(coldStartMultiplier(2, new Date().toISOString())).toBeGreaterThan(1);
    expect(coldStartMultiplier(20, new Date().toISOString())).toBe(1);
  });

  it('raw score and display score are deterministic for same input', () => {
    const ctx = {
      distanceMiles: 5,
      currentTier: 'top_performer' as const,
      customerWantsBookingSoon: false,
      servesCustomerZip: true,
      cleanerSpecialtyKeys: ['deep_clean_specialist'],
      requestedServiceKeys: ['deep'],
      completedBookingCount: 6,
      cleanerSinceAt: new Date().toISOString(),
    };

    const a = rawMatchScore(ctx);
    const b = rawMatchScore(ctx);
    expect(a).toBe(b);
    expect(toDisplayScore(a)).toBe(toDisplayScore(b));
  });

  it('transparency payload has score and six factors', () => {
    const result = computeMatchTransparency({
      distanceMiles: 4,
      currentTier: 'all_star_expert',
      customerWantsBookingSoon: false,
      servesCustomerZip: true,
      cleanerSpecialtyKeys: ['airbnb_specialist'],
      requestedServiceKeys: ['airbnb'],
      completedBookingCount: 3,
      cleanerSinceAt: new Date().toISOString(),
    });

    expect(result.displayScore).toBeGreaterThanOrEqual(0);
    expect(result.displayScore).toBeLessThanOrEqual(100);
    expect(result.factors).toHaveLength(6);
  });
});
