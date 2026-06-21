import { redirect } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMyBookingsAsCustomer } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const InboxPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const bookings = await getMyBookingsAsCustomer();
  const threads = bookings
    .filter((b) => b.other_party_name !== 'Cleaner TBD' && b.state !== 'cancelled')
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Inbox</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Your conversations, one per booking.</p>
      </div>

      {threads.length === 0 ? (
        <Card elevation={1} className="border border-neutral-200">
          <EmptyState
            showDash
            title="No conversations yet"
            description="Once you book a cleaner, your chat for that job lives here."
            action={{ label: 'Find a cleaner', href: '/app/cleaners' }}
          />
        </Card>
      ) : (
        <Card elevation={1} className="divide-y divide-neutral-100 border border-neutral-200">
          {threads.map((b) => (
            <ListRow
              key={b.id}
              href={`/app/bookings/${b.id}/messages`}
              chevron={false}
              leading={
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
                  {b.other_party_name.charAt(0).toUpperCase()}
                </div>
              }
              title={b.other_party_name}
              subtitle={`${b.service_display_name} · ${fmtDate(b.start_at)}`}
              trailing={<StatusBadge status={b.state} />}
            />
          ))}
        </Card>
      )}
    </div>
  );
};

export default InboxPage;
