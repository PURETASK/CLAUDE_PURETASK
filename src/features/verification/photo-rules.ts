import type { Database } from '@/types/database.types';

export type ServiceType = Database['public']['Enums']['service_type'];
export type PhotoPurpose = Database['public']['Enums']['photo_purpose'];

export const REQUIRED_PHOTO_COUNTS: Record<ServiceType, { before: number; after: number }> = {
  standard: { before: 2, after: 2 },
  deep: { before: 3, after: 3 },
  move_out: { before: 4, after: 4 },
  airbnb: { before: 2, after: 2 },
};

export type PhotoCounts = { before: number; after: number };

export const meetsRequirements = (counts: PhotoCounts, serviceType: ServiceType): boolean => {
  const required = REQUIRED_PHOTO_COUNTS[serviceType];
  if (!required) return false;
  return counts.before >= required.before && counts.after >= required.after;
};

export const missingPhotos = (counts: PhotoCounts, serviceType: ServiceType): PhotoCounts => {
  const required = REQUIRED_PHOTO_COUNTS[serviceType] ?? { before: 0, after: 0 };
  return {
    before: Math.max(0, required.before - counts.before),
    after: Math.max(0, required.after - counts.after),
  };
};
