/**
 * Booking state machine — mirrors the DB enum `booking_state` from
 * 0002_b2_booking_lifecycle.sql. Pure functions only; no DB access.
 *
 * Phase 6 shortcut: bookings start in `booking_requested` (skipping
 * `pending_payment_authorization`) until Phase 7 wires Stripe auth.
 */
export type BookingState =
  | 'pending_payment_authorization'
  | 'charge_failed'
  | 'booking_requested'
  | 'cleaner_declined'
  | 'confirmed'
  | 'imminent'
  | 'in_transit'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'awaiting_approval'
  | 'approved'
  | 'auto_approved'
  | 'paid'
  | 'disputed'
  | 'dispute_resolved'
  | 'reschedule_pending'
  | 'cancelled_by_customer'
  | 'cancelled_by_cleaner'
  | 'no_show_customer'
  | 'no_show_cleaner'
  | 'admin_cancelled';

export type BookingActor = 'customer' | 'cleaner' | 'system' | 'admin';

const TRANSITIONS: Record<BookingState, Partial<Record<BookingActor, BookingState[]>>> = {
  pending_payment_authorization: {
    system: ['booking_requested', 'charge_failed'],
  },
  booking_requested: {
    cleaner: ['confirmed', 'cleaner_declined'],
    customer: ['cancelled_by_customer'],
  },
  confirmed: {
    customer: ['cancelled_by_customer', 'reschedule_pending'],
    cleaner: ['cancelled_by_cleaner', 'reschedule_pending'],
    system: ['imminent'],
  },
  imminent: {
    cleaner: ['in_transit', 'cancelled_by_cleaner'],
    customer: ['cancelled_by_customer'],
    system: ['no_show_cleaner'],
  },
  in_transit: {
    cleaner: ['arrived'],
    system: ['no_show_cleaner'],
  },
  arrived: {
    cleaner: ['in_progress'],
    system: ['no_show_customer'],
  },
  in_progress: {
    cleaner: ['completed'],
  },
  completed: {
    system: ['awaiting_approval'],
  },
  awaiting_approval: {
    customer: ['approved', 'disputed'],
    system: ['auto_approved'],
  },
  approved: {
    system: ['paid'],
  },
  auto_approved: {
    system: ['paid'],
  },
  paid: {
    customer: ['disputed'],
  },
  disputed: {
    admin: ['dispute_resolved'],
  },
  dispute_resolved: {
    system: ['paid'],
  },
  reschedule_pending: {
    cleaner: ['confirmed'],
    customer: ['cancelled_by_customer'],
  },
  charge_failed: {},
  cleaner_declined: {},
  cancelled_by_customer: {},
  cancelled_by_cleaner: {},
  no_show_customer: {},
  no_show_cleaner: {},
  admin_cancelled: {},
};

export const canTransition = (
  from: BookingState,
  to: BookingState,
  actor: BookingActor,
): boolean => {
  const allowed = TRANSITIONS[from]?.[actor] ?? [];
  return allowed.includes(to);
};

export const isTerminal = (state: BookingState): boolean => {
  const next = TRANSITIONS[state];
  if (!next) return true;
  return Object.values(next).every((arr) => !arr || arr.length === 0);
};

export const allowedNextStates = (from: BookingState, actor: BookingActor): BookingState[] =>
  TRANSITIONS[from]?.[actor] ?? [];
