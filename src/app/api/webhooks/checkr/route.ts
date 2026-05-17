import { handleCheckrEvent } from '@/features/cleaner/checkr/webhook-handler';
import { verifyCheckrSignature } from '@/lib/checkr/webhooks';
import { isCheckrWebhookConfigured } from '@/lib/integrations';

export const POST = async (request: Request) => {
  if (!isCheckrWebhookConfigured()) {
    return new Response('Checkr webhooks not configured', { status: 503 });
  }

  const signature = request.headers.get('x-checkr-signature');
  const body = await request.text();

  if (!verifyCheckrSignature(body, signature)) {
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    const payload = JSON.parse(body) as { type?: string; data?: { object?: { id?: string } } };
    await handleCheckrEvent({
      type: payload.type,
      object: payload.data?.object,
    });
    return new Response('ok');
  } catch {
    return new Response('Invalid payload', { status: 400 });
  }
};
