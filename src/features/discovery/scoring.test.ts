import { describe, expect, it } from 'vitest';

import { computeMatchScore } from './scoring';

describe('computeMatchScore', () => {
  describe('tier points', () => {
    it('awards 5 pts for rising_pro', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.tier).toBe(5);
    });

    it('awards 12 pts for proven_specialist', () => {
      const result = computeMatchScore(
        {
          current_tier: 'proven_specialist',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.tier).toBe(12);
    });

    it('awards 20 pts for top_performer', () => {
      const result = computeMatchScore(
        {
          current_tier: 'top_performer',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.tier).toBe(20);
    });

    it('awards 25 pts for all_star_expert', () => {
      const result = computeMatchScore(
        {
          current_tier: 'all_star_expert',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.tier).toBe(25);
    });
  });

  describe('rating points (max 25)', () => {
    it('awards 0 pts when average_rating is null', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.rating).toBe(0);
    });

    it('awards 25 pts for a perfect 5-star rating', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: 5,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.rating).toBe(25);
    });

    it('awards 20 pts for a 4-star rating', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: 4,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.rating).toBe(20);
    });

    it('awards 0 pts for a 0-star rating', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: 0,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.rating).toBe(0);
    });
  });

  describe('reliability points (max 20)', () => {
    it('awards 20 pts for a perfect reliability score of 100', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 100,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.reliability).toBe(20);
    });

    it('awards 10 pts for a reliability score of 50', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 50,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.reliability).toBe(10);
    });

    it('awards 0 pts for a reliability score of 0', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.reliability).toBe(0);
    });
  });

  describe('zip coverage points (max 15)', () => {
    it('awards 15 pts when no zip filter is active', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.zipCoverage).toBe(15);
    });

    it('awards 15 pts when zip filter is active and cleaner covers the zip', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: true,
        },
        true,
      );
      expect(result.zipCoverage).toBe(15);
    });

    it('awards 0 pts when zip filter is active and cleaner does NOT cover the zip', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        true,
      );
      expect(result.zipCoverage).toBe(0);
    });
  });

  describe('experience points (max 10)', () => {
    it('awards 10 pts for 20+ reviews', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 20,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.experience).toBe(10);
    });

    it('awards 10 pts for more than 20 reviews (capped)', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 50,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.experience).toBe(10);
    });

    it('awards 5 pts for 10 reviews', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 10,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.experience).toBe(5);
    });

    it('awards 0 pts for 0 reviews', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.experience).toBe(0);
    });
  });

  describe('veteran bonus (5 pts)', () => {
    it('awards 5 pts for veterans', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: true,
          zip_covered: false,
        },
        false,
      );
      expect(result.veteran).toBe(5);
    });

    it('awards 0 pts for non-veterans', () => {
      const result = computeMatchScore(
        {
          current_tier: 'rising_pro',
          average_rating: null,
          current_score: 0,
          review_count: 0,
          is_veteran: false,
          zip_covered: false,
        },
        false,
      );
      expect(result.veteran).toBe(0);
    });
  });

  describe('total', () => {
    it('sums to 100 for a perfect all-star expert', () => {
      const result = computeMatchScore(
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
      expect(result.total).toBe(100);
    });

    it('total equals sum of individual components', () => {
      const input = {
        current_tier: 'top_performer' as const,
        average_rating: 4.2,
        current_score: 75,
        review_count: 8,
        is_veteran: false,
        zip_covered: true,
      };
      const result = computeMatchScore(input, true);
      expect(result.total).toBe(
        result.tier +
          result.rating +
          result.reliability +
          result.zipCoverage +
          result.experience +
          result.veteran,
      );
    });
  });
});
