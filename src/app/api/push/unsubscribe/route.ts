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

  const { endpoint } = (await req.json()) as { endpoint: string };

  const admin = createSupabaseAdminClient();

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('push_subscriptions')
    .eq('user_id', user.id)
    .single();

  const existing = (prefs?.push_subscriptions as PushSubscriptionJson[] | null) ?? [];
  const updated = existing.filter((s) => s.endpoint !== endpoint);

  await admin
    .from('notification_preferences')
    .upsert({ user_id: user.id, push_subscriptions: updated }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
