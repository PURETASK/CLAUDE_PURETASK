import { constructStripeWebhookEvent } from '@/lib/stripe/webhooks';
import { handleStripeConnectEvent } from '@/features/cleaner/connect/webhook-handler';
import { env } from '@/lib/env';

export const POST = async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!signature || !env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return new Response('Missing signature/secret', { status: 400 });
  }

  try {
    const event = constructStripeWebhookEvent(body, signature, env.STRIPE_CONNECT_WEBHOOK_SECRET);
    await handleStripeConnectEvent(event as never);
    return new Response('ok');
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
};
