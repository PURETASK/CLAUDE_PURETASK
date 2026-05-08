import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PushSubscriptionJson } from '@/lib/webpush';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as PushSubscriptionJson;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('push_subscriptions')
    .eq('user_id', user.id)
    .single();

  const existing = (prefs?.push_subscriptions as PushSubscriptionJson[] | null) ?? [];
  const alreadyExists = existing.some((s) => s.endpoint === body.endpoint);

  if (!alreadyExists) {
    const updated = [...existing, { ...body, subscribed_at: new Date().toISOString() }];

    await admin
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, push_enabled: true, push_subscriptions: updated },
        { onConflict: 'user_id' },
      );
  }

  return NextResponse.json({ ok: true });
}
