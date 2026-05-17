import { env } from '@/lib/env';
import { INTEGRATION_MESSAGES, isCheckrConfigured } from '@/lib/integrations';

const CHECKR_BASE_URL = 'https://api.checkr.com/v1';

const createHeaders = () => {
  if (!isCheckrConfigured()) {
    throw new Error(INTEGRATION_MESSAGES.checkr);
  }
  const encoded = Buffer.from(`${env.CHECKR_API_KEY}:`).toString('base64');
  return {
    Authorization: `Basic ${encoded}`,
    'Content-Type': 'application/json',
  };
};

export const createCheckrCandidate = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${CHECKR_BASE_URL}/candidates`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(payload),
  });
  return response.json();
};
