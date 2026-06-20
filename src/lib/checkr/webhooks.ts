import crypto from 'crypto';

import { env } from '@/lib/env';

export const verifyCheckrSignature = (payload: string, signature: string | null) => {
  if (!signature || !env.CHECKR_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', env.CHECKR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to avoid signature-timing leaks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
