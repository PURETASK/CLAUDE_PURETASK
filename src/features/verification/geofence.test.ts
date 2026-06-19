import { describe, expect, it } from 'vitest';

import { DEFAULT_GEOFENCE_RADIUS_METERS, haversineMeters, isWithinGeofence } from './geofence';

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    const p = { latitude: 38.5816, longitude: -121.4944 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it('measures ~111 km per degree of latitude (equator approximation)', () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 1, longitude: 0 };
    expect(Math.round(haversineMeters(a, b))).toBe(111195);
  });

  it('Sacramento to San Francisco is ~120 km', () => {
    const sac = { latitude: 38.5816, longitude: -121.4944 };
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const meters = haversineMeters(sac, sf);
    expect(meters).toBeGreaterThan(115_000);
    expect(meters).toBeLessThan(125_000);
  });

  it('is symmetric', () => {
    const a = { latitude: 38.5, longitude: -121.5 };
    const b = { latitude: 38.6, longitude: -121.4 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 5);
  });
});

describe('isWithinGeofence', () => {
  const target = { latitude: 38.5816, longitude: -121.4944 };

  it('returns true at the exact target', () => {
    expect(isWithinGeofence(target, target)).toBe(true);
  });

  it('returns true 100 m away (default 150 m radius)', () => {
    const nearby = { latitude: 38.5825, longitude: -121.4944 };
    expect(isWithinGeofence(nearby, target)).toBe(true);
  });

  it('returns false 500 m away (default 150 m radius)', () => {
    const far = { latitude: 38.5861, longitude: -121.4944 };
    expect(isWithinGeofence(far, target)).toBe(false);
  });

  it('respects custom radius', () => {
    const far = { latitude: 38.5861, longitude: -121.4944 };
    expect(isWithinGeofence(far, target, 1000)).toBe(true);
  });

  it('default radius is 150 meters', () => {
    expect(DEFAULT_GEOFENCE_RADIUS_METERS).toBe(150);
  });
});
