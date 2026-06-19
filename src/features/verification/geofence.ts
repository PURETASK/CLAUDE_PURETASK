export const DEFAULT_GEOFENCE_RADIUS_METERS = 150;

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export const haversineMeters = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const isWithinGeofence = (
  cleaner: LatLng,
  target: LatLng,
  radiusMeters: number = DEFAULT_GEOFENCE_RADIUS_METERS,
): boolean => haversineMeters(cleaner, target) <= radiusMeters;
