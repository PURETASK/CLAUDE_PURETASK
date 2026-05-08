'use server';

import { createCheckrCandidate } from '@/lib/checkr/client';

export const createCheckrCandidateAction = async (payload: Record<string, unknown>) => {
  const result = await createCheckrCandidate(payload);
  return { ok: true as const, data: result };
};
