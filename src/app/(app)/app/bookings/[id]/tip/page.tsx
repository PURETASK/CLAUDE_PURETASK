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
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">⭐</div>
        <h1 className="mb-2 text-xl font-semibold">Leave a tip for {cleanerName}?</h1>
        <p className="mb-8 text-sm text-zinc-500">
          100% of your tip goes directly to your cleaner.
        </p>

        <TipForm bookingId={id} />

        <Link
          href={`/app/bookings/${id}/receipt`}
          className="mt-4 block text-xs text-zinc-400 hover:text-zinc-600"
        >
          Skip, no tip
        </Link>
      </div>
    </div>
  );
}
