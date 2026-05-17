import { describe, expect, it } from 'vitest';

import {
  BOOKING_STATE_LABELS,
  CLEANER_ACTIVE_STATES,
  CUSTOMER_ACTIVE_STATES,
} from './booking-states';

describe('booking state constants', () => {
  it('labels every cleaner active state', () => {
    for (const state of CLEANER_ACTIVE_STATES) {
      expect(BOOKING_STATE_LABELS[state]).toBeTruthy();
    }
  });

  it('customer active states include approval states', () => {
    expect(CUSTOMER_ACTIVE_STATES).toContain('approved');
    expect(CUSTOMER_ACTIVE_STATES).toContain('auto_approved');
  });
});
