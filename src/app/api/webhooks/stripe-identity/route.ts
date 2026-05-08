import { constructStripeWebhookEvent } from '@/lib/stripe/webhooks';
import { handleStripeIdentityEvent } from '@/features/cleaner/identity/webhook-handler';
import { env } from '@/lib/env';

export const POST = async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!signature || !env.STRIPE_IDENTITY_WEBHOOK_SECRET) {
    return new Response('Missing signature/secret', { status: 400 });
  }

  try {
    const event = constructStripeWebhookEvent(body, signature, env.STRIPE_IDENTITY_WEBHOOK_SECRET);
    await handleStripeIdentityEvent(event as never);
    return new Response('ok');
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
};
