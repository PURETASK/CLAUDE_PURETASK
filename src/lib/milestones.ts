export const MILESTONES = {
  CUSTOMER_TOUR: 'customer_tour_completed',
  CLEANER_TOUR: 'cleaner_tour_completed',
  PHOTO_TRAINING: 'photo_training_completed',
  FIRST_BOOKING: 'first_booking_completed',
  FIRST_PAYOUT: 'first_payout_received',
  PROFILE_COMPLETE: 'profile_completed',
} as const;

export type MilestoneKey = (typeof MILESTONES)[keyof typeof MILESTONES];
