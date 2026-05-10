import Link from 'next/link';
import { redirect } from 'next/navigation';

import { adminResolveDispute } from '@/features/disputes/actions/admin-resolve';
import { DisputePhotoPanel } from '@/features/disputes/components/DisputePhotoPanel';
import { DisputeResolutionPanel } from '@/features/disputes/components/DisputeResolutionPanel';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const AdminDisputePage = async ({ params }: Props) => {
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

  const { data: dispute } = await supabase
    .from('disputes')
    .select(
      `id, state, customer_description, issue_category, resolution_notes, resolved_at,
       booking_id,
       bookings!disputes_booking_id_fkey(
         id, total_charge_cents, booking_number,
         booking_photos(id, cdn_url, purpose, room_label)
       ),
       customer:customer_id(
         customer_profiles!customer_profiles_id_fkey(
           users!customer_profiles_user_id_fkey(full_name)
         )
       ),
       cleaner:cleaner_id(
         cleaner_profiles!cleaner_profiles_id_fkey(
           users!cleaner_profiles_user_id_fkey(full_name)
         )
       )`,
    )
    .eq('id', id)
    .single();

  if (!dispute) redirect('/admin/disputes');

  const bookingRaw = Array.isArray(dispute.bookings)
    ? dispute.bookings[0]
    : dispute.bookings;
  const photos = ((bookingRaw as { booking_photos?: { id: string; cdn_url: string | null; purpose: string | null; room_label: string | null }[] } | null)?.booking_photos ?? []).filter(
    (p) => p.cdn_url,
  );

  const cleanerPhotos = photos
    .filter((p) => p.purpose === 'before_clock_in' || p.purpose === 'after_clock_out')
    .map((p) => ({ ...p, cdn_url: p.cdn_url!, purpose: p.purpose! }));

  const customerPhotos = photos
    .filter((p) => p.purpose === 'dispute_evidence_customer')
    .map((p) => ({ ...p, cdn_url: p.cdn_url!, purpose: p.purpose! }));

  const totalChargeCents =
    (bookingRaw as { total_charge_cents?: number } | null)?.total_charge_cents ?? 0;

  const isResolved = dispute.state === 'admin_resolved';

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin/disputes" className="text-sm text-brand-600 hover:underline">
            ← Disputes
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">
            Dispute #{id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Category: {dispute.issue_category} · State:{' '}
            <span className={isResolved ? 'text-success' : 'text-warning-dark'}>{dispute.state}</span>
          </p>
        </div>

        {isResolved && (
          <div className="rounded-2xl border border-success/30 bg-success-light p-5">
            <p className="font-semibold text-success-dark">Resolved</p>
            {dispute.resolution_notes && (
              <p className="mt-1 text-sm text-neutral-700">{dispute.resolution_notes}</p>
            )}
            {dispute.resolved_at && (
              <p className="mt-1 text-xs text-neutral-500">
                {new Date(dispute.resolved_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <DisputePhotoPanel
          customerDescription={dispute.customer_description ?? '(no description)'}
          customerPhotos={customerPhotos}
          cleanerPhotos={cleanerPhotos}
        />

        {!isResolved && (
          <DisputeResolutionPanel
            disputeId={dispute.id}
            bookingId={dispute.booking_id}
            totalChargeCents={totalChargeCents}
            onResolve={adminResolveDispute}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDisputePage;
