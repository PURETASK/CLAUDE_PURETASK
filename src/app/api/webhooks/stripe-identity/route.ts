import { handleStripeIdentityEvent } from '@/features/cleaner/identity/webhook-handler';
import { env } from '@/lib/env';
import { isStripeConfigured } from '@/lib/integrations';
import { constructStripeWebhookEvent } from '@/lib/stripe/webhooks';

export const POST = async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!isStripeConfigured() || !env.STRIPE_IDENTITY_WEBHOOK_SECRET) {
    return new Response('Stripe Identity webhooks not configured', { status: 503 });
  }
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const event = constructStripeWebhookEvent(body, signature, env.STRIPE_IDENTITY_WEBHOOK_SECRET);
    await handleStripeIdentityEvent(event as never);
    return new Response('ok');
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }
};
