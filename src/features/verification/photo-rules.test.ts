import { describe, expect, it } from 'vitest';

import { meetsRequirements, missingPhotos, REQUIRED_PHOTO_COUNTS } from './photo-rules';

describe('REQUIRED_PHOTO_COUNTS', () => {
  it('covers all service types', () => {
    const keys = Object.keys(REQUIRED_PHOTO_COUNTS).sort();
    expect(keys).toEqual(['airbnb', 'deep', 'move_out', 'standard']);
  });

  it('every service requires at least 2 before + 2 after', () => {
    for (const counts of Object.values(REQUIRED_PHOTO_COUNTS)) {
      expect(counts.before).toBeGreaterThanOrEqual(2);
      expect(counts.after).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('meetsRequirements', () => {
  it('passes when counts meet exactly', () => {
    expect(meetsRequirements({ before: 2, after: 2 }, 'standard')).toBe(true);
  });

  it('passes when counts exceed', () => {
    expect(meetsRequirements({ before: 5, after: 5 }, 'standard')).toBe(true);
  });

  it('fails if before is short by one', () => {
    expect(meetsRequirements({ before: 1, after: 2 }, 'standard')).toBe(false);
  });

  it('fails if after is short by one', () => {
    expect(meetsRequirements({ before: 2, after: 1 }, 'standard')).toBe(false);
  });

  it('deep clean requires 3+3', () => {
    expect(meetsRequirements({ before: 2, after: 3 }, 'deep')).toBe(false);
    expect(meetsRequirements({ before: 3, after: 3 }, 'deep')).toBe(true);
  });

  it('move_out requires 4+4', () => {
    expect(meetsRequirements({ before: 3, after: 4 }, 'move_out')).toBe(false);
    expect(meetsRequirements({ before: 4, after: 4 }, 'move_out')).toBe(true);
  });
});

describe('missingPhotos', () => {
  it('returns 0/0 when met', () => {
    expect(missingPhotos({ before: 3, after: 3 }, 'standard')).toEqual({ before: 0, after: 0 });
  });

  it('returns the gap when short', () => {
    expect(missingPhotos({ before: 0, after: 1 }, 'standard')).toEqual({ before: 2, after: 1 });
  });

  it('never returns negative values', () => {
    expect(missingPhotos({ before: 10, after: 10 }, 'standard')).toEqual({ before: 0, after: 0 });
  });
});
