export interface CancellationResult {
  penaltyCents: number;
  refundCents: number;
  tier: 'free' | 'partial' | 'full';
  hoursUntilStart: number;
}

export function calculateCancellationPenalty(
  bookingStartAt: Date,
  totalChargeCents: number,
): CancellationResult {
  const hoursUntilStart = (bookingStartAt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilStart >= 48) {
    return { penaltyCents: 0, refundCents: totalChargeCents, tier: 'free', hoursUntilStart };
  }
  if (hoursUntilStart >= 24) {
    const penalty = Math.round(totalChargeCents * 0.5);
    return {
      penaltyCents: penalty,
      refundCents: totalChargeCents - penalty,
      tier: 'partial',
      hoursUntilStart,
    };
  }
  return { penaltyCents: totalChargeCents, refundCents: 0, tier: 'full', hoursUntilStart };
}

export const CANCELLATION_POLICY_TEXT = {
  free: 'Cancel more than 48 hours before your appointment for a full refund.',
  partial: 'Cancel 24–48 hours before: 50% refund.',
  full: 'Cancel less than 24 hours before: no refund.',
} as const;
