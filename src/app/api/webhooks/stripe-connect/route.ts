import { handleStripeConnectEvent } from '@/features/cleaner/connect/webhook-handler';
import { env } from '@/lib/env';
import { isStripeConfigured } from '@/lib/integrations';
import { constructStripeWebhookEvent } from '@/lib/stripe/webhooks';

export const POST = async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!isStripeConfigured() || !env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return new Response('Stripe Connect webhooks not configured', { status: 503 });
  }
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const event = constructStripeWebhookEvent(body, signature, env.STRIPE_CONNECT_WEBHOOK_SECRET);
    await handleStripeConnectEvent(event as never);
    return new Response('ok');
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
};
