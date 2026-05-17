'use server';

import { INTEGRATION_MESSAGES, isCheckrConfigured } from '@/lib/integrations';
import { createCheckrCandidate } from '@/lib/checkr/client';

export const createCheckrCandidateAction = async (payload: Record<string, unknown>) => {
  if (!isCheckrConfigured()) {
    return { ok: false as const, error: INTEGRATION_MESSAGES.checkr };
  }

  const result = await createCheckrCandidate(payload);
  return { ok: true as const, data: result };
};
