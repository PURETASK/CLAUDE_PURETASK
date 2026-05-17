import { describe, expect, it } from 'vitest';

import { getIntegrationStatuses, INTEGRATION_MESSAGES } from './integrations';

describe('integrations', () => {
  it('includes supabase in status list', () => {
    const ids = getIntegrationStatuses().map((s) => s.id);
    expect(ids).toContain('supabase');
    expect(ids).toContain('stripe');
  });

  it('exposes user-facing messages for missing services', () => {
    expect(INTEGRATION_MESSAGES.stripe).toMatch(/Stripe/i);
    expect(INTEGRATION_MESSAGES.checkr).toMatch(/Checkr/i);
  });
});
