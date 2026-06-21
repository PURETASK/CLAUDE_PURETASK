import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getBookingById, getMyCustomerProfileId } from '@/features/booking/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { TipForm } from './TipForm';

type PageProps = { params: Promise<{ id: string }> };

export default async function TipPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [booking, customerProfileId] = await Promise.all([
    getBookingById(id),
    getMyCustomerProfileId(),
  ]);

  if (!booking) notFound();
  if (booking.customer_id !== customerProfileId) notFound();

  // Only show tip page for freshly approved bookings
  if (!['paid', 'approved', 'auto_approved'].includes(booking.state)) {
    redirect(`/app/bookings/${id}/receipt`);
  }

  const cleanerName = booking.other_party_name ?? 'your cleaner';

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-tier1">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-400">
          {cleanerName.charAt(0)}
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Show {cleanerName} some appreciation
        </h1>
        <p className="mb-6 mt-1 text-sm text-neutral-500">
          {booking.service_display_name} · tips are voluntary and 100% go to your cleaner.
        </p>

        <TipForm bookingId={id} />

        <Link
          href={`/app/bookings/${id}/receipt`}
          className="mt-4 block text-xs text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Skip, no tip
        </Link>
      </div>
    </div>
  );
}
