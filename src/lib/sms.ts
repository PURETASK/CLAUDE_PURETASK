import { env } from '@/lib/env';

export const sendSms = async (to: string, body: string): Promise<boolean> => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_PHONE) return false;
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ to, from: env.TWILIO_FROM_PHONE, body });
    return true;
  } catch {
    return false;
  }
};
