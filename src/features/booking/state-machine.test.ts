import { describe, expect, it } from 'vitest';

import { allowedNextStates, canTransition, isTerminal } from './state-machine';

describe('canTransition', () => {
  describe('pending_payment_authorization', () => {
    it('system can move to booking_requested on auth success', () => {
      expect(canTransition('pending_payment_authorization', 'booking_requested', 'system')).toBe(
        true,
      );
    });
    it('system can move to charge_failed on auth fail', () => {
      expect(canTransition('pending_payment_authorization', 'charge_failed', 'system')).toBe(true);
    });
    it('customer cannot self-transition out of pending_payment_authorization', () => {
      expect(canTransition('pending_payment_authorization', 'booking_requested', 'customer')).toBe(
        false,
      );
    });
  });

  describe('booking_requested', () => {
    it('cleaner can accept → confirmed', () => {
      expect(canTransition('booking_requested', 'confirmed', 'cleaner')).toBe(true);
    });
    it('cleaner can decline', () => {
      expect(canTransition('booking_requested', 'cleaner_declined', 'cleaner')).toBe(true);
    });
    it('customer can cancel', () => {
      expect(canTransition('booking_requested', 'cancelled_by_customer', 'customer')).toBe(true);
    });
    it('customer cannot accept (wrong actor)', () => {
      expect(canTransition('booking_requested', 'confirmed', 'customer')).toBe(false);
    });
  });

  describe('confirmed', () => {
    it('customer can cancel', () => {
      expect(canTransition('confirmed', 'cancelled_by_customer', 'customer')).toBe(true);
    });
    it('cleaner can cancel', () => {
      expect(canTransition('confirmed', 'cancelled_by_cleaner', 'cleaner')).toBe(true);
    });
    it('system can advance to imminent', () => {
      expect(canTransition('confirmed', 'imminent', 'system')).toBe(true);
    });
  });

  describe('lifecycle through completion', () => {
    it('in_progress → completed (cleaner)', () => {
      expect(canTransition('in_progress', 'completed', 'cleaner')).toBe(true);
    });
    it('completed → awaiting_approval (system)', () => {
      expect(canTransition('completed', 'awaiting_approval', 'system')).toBe(true);
    });
    it('awaiting_approval → approved (customer)', () => {
      expect(canTransition('awaiting_approval', 'approved', 'customer')).toBe(true);
    });
    it('awaiting_approval → auto_approved (system timer)', () => {
      expect(canTransition('awaiting_approval', 'auto_approved', 'system')).toBe(true);
    });
    it('approved → paid (system, after Stripe capture)', () => {
      expect(canTransition('approved', 'paid', 'system')).toBe(true);
    });
    it('paid → disputed (customer within window)', () => {
      expect(canTransition('paid', 'disputed', 'customer')).toBe(true);
    });
    it('disputed → dispute_resolved (admin only)', () => {
      expect(canTransition('disputed', 'dispute_resolved', 'admin')).toBe(true);
      expect(canTransition('disputed', 'dispute_resolved', 'customer')).toBe(false);
    });
  });

  describe('terminal states', () => {
    it.each([
      'charge_failed',
      'cleaner_declined',
      'cancelled_by_customer',
      'cancelled_by_cleaner',
      'no_show_customer',
      'no_show_cleaner',
      'admin_cancelled',
    ] as const)('%s is terminal', (state) => {
      expect(isTerminal(state)).toBe(true);
    });

    it('booking_requested is NOT terminal', () => {
      expect(isTerminal('booking_requested')).toBe(false);
    });

    it('terminal states reject all transitions', () => {
      expect(canTransition('cleaner_declined', 'confirmed', 'cleaner')).toBe(false);
      expect(canTransition('cancelled_by_customer', 'confirmed', 'customer')).toBe(false);
      expect(canTransition('charge_failed', 'booking_requested', 'system')).toBe(false);
    });
  });

  describe('allowedNextStates', () => {
    it('lists everything a cleaner can do from booking_requested', () => {
      expect(allowedNextStates('booking_requested', 'cleaner').sort()).toEqual(
        ['cleaner_declined', 'confirmed'].sort(),
      );
    });

    it('returns [] for an actor with no rights from a state', () => {
      expect(allowedNextStates('booking_requested', 'admin')).toEqual([]);
    });
  });
});
