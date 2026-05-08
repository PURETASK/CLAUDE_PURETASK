import { computeMatchTransparency, type MatchTransparency } from '@/features/discovery/match-score';
import type { BrowseSearchInput } from '@/features/discovery/validation';

import type { CleanerBrowseRow, CustomerDiscoveryAnchor } from './queries';
import { haversineMiles } from './queries';

export type RankedCleaner = {
  row: CleanerBrowseRow;
  miles: number | null;
  transparency: MatchTransparency;
};

const lowestHourlyUsd = (row: CleanerBrowseRow): number | null => {
  const vals = Object.values(row.hourly_rates_cents).filter((c) => c > 0);
  if (vals.length === 0) return null;
  return Math.min(...vals) / 100;
};

export const rankBrowseCleaners = (
  rows: CleanerBrowseRow[],
  anchor: CustomerDiscoveryAnchor | null,
  opts: BrowseSearchInput,
): RankedCleaner[] => {
  const customerZip = anchor?.zipCode?.trim() ?? null;

  const ranked: RankedCleaner[] = rows.map((row) => {
    let miles: number | null = null;
    if (
      anchor?.latitude != null &&
      anchor.longitude != null &&
      row.home_latitude != null &&
      row.home_longitude != null
    ) {
      miles = haversineMiles(
        anchor.latitude,
        anchor.longitude,
        row.home_latitude,
        row.home_longitude,
      );
    }

    const servesZip = Boolean(customerZip && row.service_zip_codes.includes(customerZip));

    const transparency = computeMatchTransparency({
      distanceMiles: miles,
      currentTier: row.current_tier,
      customerWantsBookingSoon: Boolean(opts.availability?.trim()),
      servesCustomerZip: servesZip,
      cleanerSpecialtyKeys: row.specialty_keys,
      requestedServiceKeys: opts.services.length > 0 ? opts.services : [],
      completedBookingCount: row.completed_booking_count,
      cleanerSinceAt: row.cleaner_since_at,
    });

    return { row, miles, transparency };
  });

  const tieMatch = (a: RankedCleaner, b: RankedCleaner) => {
    if (b.transparency.displayScore !== a.transparency.displayScore) {
      return b.transparency.displayScore - a.transparency.displayScore;
    }
    if (b.row.completed_booking_count !== a.row.completed_booking_count) {
      return b.row.completed_booking_count - a.row.completed_booking_count;
    }
    return new Date(a.row.created_at).getTime() - new Date(b.row.created_at).getTime();
  };

  switch (opts.sort) {
    case 'distance':
      ranked.sort((a, b) => {
        if (a.miles == null && b.miles == null) return tieMatch(a, b);
        if (a.miles == null) return 1;
        if (b.miles == null) return -1;
        if (a.miles !== b.miles) return a.miles - b.miles;
        return tieMatch(a, b);
      });
      break;
    case 'rating':
      ranked.sort((a, b) => {
        const ar = a.row.average_rating ?? -1;
        const br = b.row.average_rating ?? -1;
        if (br !== ar) return br - ar;
        return tieMatch(a, b);
      });
      break;
    case 'price': {
      ranked.sort((a, b) => {
        const ap = lowestHourlyUsd(a.row);
        const bp = lowestHourlyUsd(b.row);
        if (ap == null && bp == null) return tieMatch(a, b);
        if (ap == null) return 1;
        if (bp == null) return -1;
        if (ap !== bp) return ap - bp;
        return tieMatch(a, b);
      });
      break;
    }
    default:
      ranked.sort(tieMatch);
  }

  return ranked;
};
