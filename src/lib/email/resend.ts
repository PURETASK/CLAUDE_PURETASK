import { Resend } from 'resend';

import { env } from '@/lib/env';

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? 'PureTask <noreply@puretask.com>';

export const sendEmail = async (opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (!resend) return; // silently skip if Resend not configured
  try {
    await resend.emails.send({ from: FROM_EMAIL, ...opts });
  } catch (err) {
    console.error('[email] send failed', err);
  }
};
