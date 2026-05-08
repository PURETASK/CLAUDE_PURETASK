import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { PushSubscriptionToggle } from '@/components/PushSubscriptionToggle';
import { SmsSettingsForm } from './SmsSettingsForm';

export default async function NotificationsSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const admin = createSupabaseAdminClient();
  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('sms_enabled, sms_phone')
    .eq('user_id', user.id)
    .single();

  const vapidKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/settings" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Back to settings
        </Link>
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">Email notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'Booking confirmed', sub: 'When your cleaner accepts a request' },
              { label: 'Work awaiting approval', sub: 'When the cleaner marks the job complete' },
              { label: 'Dispute response', sub: 'When your cleaner responds to a dispute' },
              { label: 'New booking request', sub: 'Cleaners: when a customer requests you' },
              { label: 'Payout initiated', sub: 'Cleaners: when a payout is sent' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{item.label}</p>
                  <p className="text-xs text-zinc-400">{item.sub}</p>
                </div>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  On
                </span>
              </div>
            ))}
          </div>
        </div>

        {vapidKey && (
          <div className="rounded-xl border border-zinc-100 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">Push notifications</h2>
            <PushSubscriptionToggle vapidPublicKey={vapidKey} />
          </div>
        )}

        <div className="rounded-xl border border-zinc-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">SMS notifications</h2>
          <SmsSettingsForm
            currentPhone={prefs?.sms_phone ?? null}
            currentEnabled={prefs?.sms_enabled ?? false}
          />
        </div>
      </div>
    </div>
  );
}
