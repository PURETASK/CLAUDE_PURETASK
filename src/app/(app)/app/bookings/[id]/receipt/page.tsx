import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingById } from '@/features/booking/queries';
import { getChargeForBooking, getDefaultPaymentMethod } from '@/features/payments/queries';

type Props = { params: Promise<{ id: string }> };

const fmtPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

const CHARGE_STATE_LABELS: Record<string, string> = {
  pending: 'Pending',
  authorized: 'Authorized',
  captured: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export default async function BookingReceiptPage({ params }: Props) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [charge] = await Promise.all([getChargeForBooking(id)]);

  // Look up the payment method used for this charge if available
  let pmDisplay: string | null = null;
  if (charge?.payment_method_id) {
    // We already have the card info on the charge via join — fetch it
    const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
    const admin = createSupabaseAdminClient();
    const { data: pm } = await admin
      .from('payment_methods')
      .select('card_brand, card_last_four')
      .eq('id', charge.payment_method_id)
      .single();
    if (pm?.card_brand && pm?.card_last_four) {
      const brand = pm.card_brand.charAt(0).toUpperCase() + pm.card_brand.slice(1);
      pmDisplay = `${brand} ···· ${pm.card_last_four}`;
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <Link
          href={`/app/bookings/${id}`}
          className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600"
        >
          ← Back to booking
        </Link>
        <h1 className="text-xl font-semibold">Receipt</h1>
        <p className="text-sm text-zinc-500">Booking {booking.booking_number}</p>
      </div>

      {/* Booking summary */}
      <section className="mb-5 rounded-lg border border-zinc-200 bg-white p-5 text-sm">
        <p className="mb-3 font-medium">Booking summary</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-zinc-600">
          <dt>Cleaner</dt>
          <dd className="font-medium text-zinc-800">{booking.other_party_name}</dd>
          <dt>Date</dt>
          <dd>
            {new Date(booking.start_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </dd>
          <dt>Service</dt>
          <dd>{booking.service_display_name}</dd>
          <dt>Duration</dt>
          <dd>{booking.duration_hours_decimal}h</dd>
        </dl>
      </section>

      {/* Pricing breakdown */}
      <section className="mb-5 rounded-lg border border-zinc-200 bg-white p-5 text-sm">
        <p className="mb-3 font-medium">Charges</p>
        <div className="flex flex-col gap-1.5 text-zinc-600">
          <div className="flex justify-between">
            <span>
              {fmtPrice(booking.hourly_rate_cents)}/hr × {booking.duration_hours_decimal}h
            </span>
            <span>{fmtPrice(booking.cleaner_subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>PureTask service fee</span>
            <span>{fmtPrice(booking.platform_fee_cents)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-1.5 font-medium text-zinc-900">
            <span>Total charged</span>
            <span>{fmtPrice(booking.total_charge_cents)}</span>
          </div>
        </div>
      </section>

      {/* Payment status */}
      <section className="mb-5 rounded-lg border border-zinc-200 bg-white p-5 text-sm">
        <p className="mb-3 font-medium">Payment</p>
        {charge ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-zinc-600">
            <dt>Status</dt>
            <dd>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  charge.state === 'captured'
                    ? 'bg-green-50 text-green-700'
                    : charge.state === 'failed'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {CHARGE_STATE_LABELS[charge.state] ?? charge.state}
              </span>
            </dd>
            {pmDisplay && (
              <>
                <dt>Card</dt>
                <dd>{pmDisplay}</dd>
              </>
            )}
            <dt>Authorized</dt>
            <dd>{fmtDate(charge.authorized_at)}</dd>
            {charge.captured_at && (
              <>
                <dt>Captured</dt>
                <dd>{fmtDate(charge.captured_at)}</dd>
              </>
            )}
            {charge.total_refunded_cents > 0 && (
              <>
                <dt>Refunded</dt>
                <dd className="text-red-600">−{fmtPrice(charge.total_refunded_cents)}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="text-zinc-400">No payment record found for this booking.</p>
        )}
      </section>

      <p className="text-center text-xs text-zinc-400">
        Questions? Contact{' '}
        <a href="mailto:support@puretask.com" className="underline">
          support@puretask.com
        </a>
      </p>
    </div>
  );
}
