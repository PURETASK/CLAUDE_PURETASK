import crypto from 'crypto';

import { env } from '@/lib/env';

export const verifyCheckrSignature = (payload: string, signature: string | null) => {
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', env.CHECKR_WEBHOOK_SECRET ?? '')
    .update(payload)
    .digest('hex');

  return signature === expected;
};
