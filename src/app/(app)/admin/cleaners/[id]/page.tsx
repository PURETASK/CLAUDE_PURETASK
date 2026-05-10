import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const AdminCleanerDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: me } = await supabase.from('users').select('primary_role').eq('id', user.id).single();
  if (me?.primary_role !== 'admin') redirect('/app');

  const { data: profile } = await supabase
    .from('cleaner_profiles')
    .select(
      `id, current_score, current_tier, is_active, completed_booking_count, average_rating,
       review_count, cleaner_since_at, stripe_connect_account_id,
       users!cleaner_profiles_user_id_fkey(id, full_name, email, created_at)`,
    )
    .eq('id', id)
    .single();
  if (!profile) redirect('/admin');

  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('id, booking_number, state, start_at, total_charge_cents, cleaner_payout_cents')
    .eq('cleaner_id', id)
    .order('start_at', { ascending: false })
    .limit(20);

  const { data: insurancePolicy } = await supabase
    .from('insurance_policies')
    .select('state, verified_at, expires_at')
    .eq('cleaner_id', id)
    .not('state', 'eq', 'replaced')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const userRaw = Array.isArray(profile.users) ? profile.users[0] : profile.users;
  const cleanerUser = userRaw as { id?: string; full_name?: string; email?: string; created_at?: string } | null;

  const TIER_LABELS: Record<string, string> = {
    rising_pro: 'Rising Pro',
    proven_specialist: 'Proven Specialist',
    top_performer: 'Top Performer',
    all_star_expert: 'All-Star Expert',
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">
            {cleanerUser?.full_name ?? 'Cleaner'}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">{cleanerUser?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Score', value: profile.current_score },
            { label: 'Tier', value: TIER_LABELS[profile.current_tier] ?? profile.current_tier },
            { label: 'Completed', value: profile.completed_booking_count },
            { label: 'Avg Rating', value: profile.average_rating ? `${Number(profile.average_rating).toFixed(1)} ★` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-tier1 text-center">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1 space-y-3">
          <h2 className="font-semibold text-neutral-900">Status Flags</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={profile.is_active ? 'text-success' : 'text-error'}>●</span>
              Account {profile.is_active ? 'Active' : 'Deactivated'}
            </div>
            <div className="flex items-center gap-2">
              <span className={profile.stripe_connect_account_id ? 'text-success' : 'text-warning-dark'}>●</span>
              Stripe {profile.stripe_connect_account_id ? 'Connected' : 'Not connected'}
            </div>
            <div className="flex items-center gap-2">
              <span className={insurancePolicy?.state === 'verified' ? 'text-success' : 'text-neutral-400'}>●</span>
              Insurance {insurancePolicy?.state ?? 'None'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-tier1">
          <h2 className="mb-4 font-semibold text-neutral-900">Recent Bookings</h2>
          {(recentBookings ?? []).length === 0 ? (
            <p className="text-sm text-neutral-400">No bookings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Date', 'State', 'Total', 'Payout'].map((h) => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold text-neutral-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(recentBookings ?? []).map((b) => (
                    <tr key={b.id}>
                      <td className="py-2">{new Date(b.start_at).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                          {b.state}
                        </span>
                      </td>
                      <td className="py-2">${((b.total_charge_cents ?? 0) / 100).toFixed(2)}</td>
                      <td className="py-2">${((b.cleaner_payout_cents ?? 0) / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCleanerDetailPage;
