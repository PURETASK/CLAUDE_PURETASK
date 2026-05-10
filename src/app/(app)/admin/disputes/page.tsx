import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const AdminDisputesPage = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase.from('users').select('primary_role').eq('id', user.id).single();
  if (me?.primary_role !== 'admin') redirect('/app');

  const { data: disputes } = await supabase
    .from('disputes')
    .select(
      `id, state, issue_category, created_at, resolved_at,
       bookings!disputes_booking_id_fkey(booking_number, total_charge_cents)`,
    )
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Disputes</h1>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                {['ID', 'Category', 'Booking', 'Filed', 'State', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(disputes ?? []).map((d) => {
                const bookingRaw = Array.isArray(d.bookings) ? d.bookings[0] : d.bookings;
                const booking = bookingRaw as { booking_number?: string; total_charge_cents?: number } | null;
                const isResolved = d.state === 'admin_resolved' || d.state === 'mutually_resolved' || d.state === 'expired';

                return (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs">{d.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3">{d.issue_category}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {booking?.booking_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isResolved
                            ? 'bg-neutral-100 text-neutral-600'
                            : d.state === 'escalated'
                              ? 'bg-error/10 text-error'
                              : 'bg-warning/10 text-warning-dark'
                        }`}
                      >
                        {d.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/disputes/${d.id}`} className="text-xs text-brand-600 hover:underline">
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(disputes ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-400">No disputes found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputesPage;
