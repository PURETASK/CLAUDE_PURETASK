import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const AdminCustomerDetailPage = async ({ params }: Props) => {
  const { id } = await params;
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

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select(
      `id, created_at,
       users!customer_profiles_user_id_fkey(id, full_name, email, created_at)`,
    )
    .eq('id', id)
    .single();
  if (!profile) redirect('/admin');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_number, state, start_at, total_charge_cents')
    .eq('customer_id', id)
    .order('start_at', { ascending: false })
    .limit(20);

  const { data: disputes } = await supabase
    .from('disputes')
    .select('id, state, issue_category, created_at')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const totalSpentCents = (bookings ?? [])
    .filter((b) => ['approved', 'auto_approved', 'paid'].includes(b.state))
    .reduce((sum, b) => sum + (b.total_charge_cents ?? 0), 0);

  const userRaw = Array.isArray(profile.users) ? profile.users[0] : profile.users;
  const customerUser = userRaw as {
    id?: string;
    full_name?: string;
    email?: string;
    created_at?: string;
  } | null;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">
            {customerUser?.full_name ?? 'Customer'}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {customerUser?.email} · Member since{' '}
            {customerUser?.created_at
              ? new Date(customerUser.created_at).toLocaleDateString([], {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Bookings', value: bookings?.length ?? 0 },
            { label: 'Total Spent', value: `$${(totalSpentCents / 100).toFixed(2)}` },
            { label: 'Disputes', value: disputes?.length ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 text-center"
            >
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">Booking History</h2>
          {(bookings ?? []).length === 0 ? (
            <p className="text-sm text-neutral-400">No bookings.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['Date', 'State', 'Total', 'Refund'].map((h) => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold text-neutral-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(bookings ?? []).map((b) => (
                  <tr key={b.id}>
                    <td className="py-2">{new Date(b.start_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {b.state}
                      </span>
                    </td>
                    <td className="py-2">${((b.total_charge_cents ?? 0) / 100).toFixed(2)}</td>
                    <td className="py-2">
                      <Link
                        href={`/admin/bookings/${b.id}/refund`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Refund
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {(disputes ?? []).length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
            <h2 className="mb-4 font-semibold text-neutral-900">Disputes</h2>
            <div className="space-y-2">
              {(disputes ?? []).map((d) => (
                <Link
                  key={d.id}
                  href={`/app/admin/disputes/${d.id}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{d.issue_category}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.state === 'admin_resolved'
                        ? 'bg-success/10 text-success-dark'
                        : 'bg-warning/10 text-warning-dark'
                    }`}
                  >
                    {d.state}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomerDetailPage;
