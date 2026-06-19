import { describe, expect, it } from 'vitest';

import { computeMatchScore, type MatchScoreInput } from './scoring';

const baseCleaner: MatchScoreInput = {
  current_tier: 'rising_pro',
  average_rating: null,
  current_score: 0,
  review_count: 0,
  is_veteran: false,
  zip_covered: false,
};

describe('computeMatchScore', () => {
  describe('tier points', () => {
    it.each([
      ['rising_pro', 5],
      ['proven_specialist', 12],
      ['top_performer', 20],
      ['all_star_expert', 25],
    ] as const)('awards %s tier %s pts', (tier, expected) => {
      const score = computeMatchScore({ ...baseCleaner, current_tier: tier }, false);
      expect(score.tier).toBe(expected);
    });
  });

  describe('rating points', () => {
    it('null rating = 0', () => {
      expect(computeMatchScore(baseCleaner, false).rating).toBe(0);
    });
    it('5.0 rating = 25', () => {
      expect(computeMatchScore({ ...baseCleaner, average_rating: 5 }, false).rating).toBe(25);
    });
    it('4.0 rating = 20', () => {
      expect(computeMatchScore({ ...baseCleaner, average_rating: 4 }, false).rating).toBe(20);
    });
    it('rounds 4.2 to 21', () => {
      expect(computeMatchScore({ ...baseCleaner, average_rating: 4.2 }, false).rating).toBe(21);
    });
  });

  describe('reliability points', () => {
    it('100 score = 20 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, current_score: 100 }, false).reliability).toBe(20);
    });
    it('50 score = 10 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, current_score: 50 }, false).reliability).toBe(10);
    });
    it('0 score = 0 pts', () => {
      expect(computeMatchScore(baseCleaner, false).reliability).toBe(0);
    });
  });

  describe('zip coverage', () => {
    it('no zip filter → 15 pts regardless of coverage', () => {
      expect(computeMatchScore(baseCleaner, false).zipCoverage).toBe(15);
      expect(computeMatchScore({ ...baseCleaner, zip_covered: true }, false).zipCoverage).toBe(15);
    });
    it('with zip filter + covered → 15 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, zip_covered: true }, true).zipCoverage).toBe(15);
    });
    it('with zip filter + not covered → 0 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, zip_covered: false }, true).zipCoverage).toBe(0);
    });
  });

  describe('experience points', () => {
    it('0 reviews = 0 pts', () => {
      expect(computeMatchScore(baseCleaner, false).experience).toBe(0);
    });
    it('10 reviews = 5 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, review_count: 10 }, false).experience).toBe(5);
    });
    it('20 reviews = 10 pts (cap)', () => {
      expect(computeMatchScore({ ...baseCleaner, review_count: 20 }, false).experience).toBe(10);
    });
    it('100 reviews still caps at 10 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, review_count: 100 }, false).experience).toBe(10);
    });
  });

  describe('veteran', () => {
    it('veteran adds 5 pts', () => {
      expect(computeMatchScore({ ...baseCleaner, is_veteran: true }, false).veteran).toBe(5);
    });
    it('non-veteran adds 0', () => {
      expect(computeMatchScore(baseCleaner, false).veteran).toBe(0);
    });
  });

  describe('total', () => {
    it('all-zero non-veteran with no filter scores 20 (5 tier + 15 zip free)', () => {
      expect(computeMatchScore(baseCleaner, false).total).toBe(20);
    });
    it('perfect all-star scores 100', () => {
      const perfect = computeMatchScore(
        {
          current_tier: 'all_star_expert',
          average_rating: 5,
          current_score: 100,
          review_count: 20,
          is_veteran: true,
          zip_covered: true,
        },
        true,
      );
      expect(perfect.total).toBe(100);
    });
    it('total equals sum of all factor pts', () => {
      const s = computeMatchScore(
        {
          current_tier: 'top_performer',
          average_rating: 4.5,
          current_score: 80,
          review_count: 12,
          is_veteran: false,
          zip_covered: true,
        },
        true,
      );
      expect(s.total).toBe(
        s.tier + s.rating + s.reliability + s.zipCoverage + s.experience + s.veteran,
      );
    });
  });
});
