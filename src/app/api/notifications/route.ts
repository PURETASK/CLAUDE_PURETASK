import { NextResponse } from 'next/server';

import { getRecentNotifications } from '@/features/notifications/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const notifications = await getRecentNotifications(20);
  return NextResponse.json(notifications);
}
