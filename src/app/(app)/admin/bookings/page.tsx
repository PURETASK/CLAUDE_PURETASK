import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<{ q?: string; state?: string }>;
}

const AdminBookingsPage = async ({ searchParams }: Props) => {
  const { q, state } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase
    .from('users')
    .select('primary_role')
    .eq('id', user.id)
    .single();
  if (me?.primary_role !== 'admin') redirect('/app');

  let query = supabase
    .from('bookings')
    .select(
      `id, booking_number, state, start_at, total_charge_cents, created_at,
       customer_profiles!bookings_customer_id_fkey(users!customer_profiles_user_id_fkey(full_name)),
       cleaner_profiles!bookings_cleaner_id_fkey(users!cleaner_profiles_user_id_fkey(full_name))`,
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (state) query = query.eq('state', state as never);

  const { data: bookings } = await query;

  const filteredBookings = (bookings ?? []).filter((b) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      (b.booking_number ?? '').toLowerCase().includes(lower) || b.id.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Bookings</h1>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by booking # or ID…"
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['Booking #', 'Date', 'Customer', 'Cleaner', 'Total', 'State', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBookings.map((b) => {
                const custRaw = Array.isArray(b.customer_profiles)
                  ? b.customer_profiles[0]
                  : b.customer_profiles;
                const custUser = Array.isArray((custRaw as { users?: unknown } | null)?.users)
                  ? (custRaw as { users: unknown[] }).users[0]
                  : (custRaw as { users?: unknown } | null)?.users;
                const customerName = (custUser as { full_name?: string } | null)?.full_name ?? '—';

                const clnrRaw = Array.isArray(b.cleaner_profiles)
                  ? b.cleaner_profiles[0]
                  : b.cleaner_profiles;
                const clnrUser = Array.isArray((clnrRaw as { users?: unknown } | null)?.users)
                  ? (clnrRaw as { users: unknown[] }).users[0]
                  : (clnrRaw as { users?: unknown } | null)?.users;
                const cleanerName = (clnrUser as { full_name?: string } | null)?.full_name ?? '—';

                return (
                  <tr key={b.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {b.booking_number ?? b.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(b.start_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{customerName}</td>
                    <td className="px-4 py-3">{cleanerName}</td>
                    <td className="px-4 py-3 font-medium">
                      ${((b.total_charge_cents ?? 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {b.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}/refund`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Refund
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-400">No bookings found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingsPage;
