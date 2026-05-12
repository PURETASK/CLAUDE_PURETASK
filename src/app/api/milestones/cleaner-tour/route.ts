import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('user_milestones')
    .upsert({ user_id: user.id, milestone_key: 'cleaner_tour_completed' }, { onConflict: 'user_id,milestone_key' });

  return NextResponse.json({ ok: true });
}
