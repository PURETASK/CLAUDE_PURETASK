import Link from 'next/link';
import { redirect } from 'next/navigation';

import { adminProcessRefund } from '@/features/admin/actions/refund-actions';
import { RefundForm } from '@/features/admin/components/RefundForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const AdminRefundPage = async ({ params }: Props) => {
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

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, booking_number, total_charge_cents')
    .eq('id', id)
    .single();
  if (!booking) redirect('/admin/bookings');

  const { data: charge } = await supabase
    .from('charges')
    .select('id, total_refunded_cents')
    .eq('booking_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!charge) redirect('/admin/bookings');

  return (
    <div>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link href={`/admin/bookings`} className="text-sm text-brand-600 hover:underline">
            ← Bookings
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">Process Refund</h1>
        </div>
        <RefundForm
          bookingId={booking.id}
          bookingNumber={booking.booking_number ?? booking.id.slice(0, 8).toUpperCase()}
          totalChargeCents={booking.total_charge_cents ?? 0}
          alreadyRefundedCents={Number(charge.total_refunded_cents ?? 0)}
          chargeId={charge.id}
          onRefund={adminProcessRefund}
        />
      </div>
    </div>
  );
};

export default AdminRefundPage;
