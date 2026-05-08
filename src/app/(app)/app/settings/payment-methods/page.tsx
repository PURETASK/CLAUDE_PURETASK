import Link from 'next/link';

import { PaymentMethodCard } from '@/features/payments/components/PaymentMethodCard';
import { getMyPaymentMethods } from '@/features/payments/queries';

export default async function PaymentMethodsPage() {
  const methods = await getMyPaymentMethods();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/app/settings" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Back to settings
        </Link>
        <h1 className="text-xl font-semibold">Payment methods</h1>
        <p className="text-sm text-zinc-500">
          Cards are used to pay for bookings. A default card is required to book.
        </p>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
          <p className="text-sm text-zinc-500">No payment methods saved yet.</p>
          <p className="mt-1 text-xs text-zinc-400">Add a card below to start booking cleaners.</p>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {methods.map((pm) => (
            <PaymentMethodCard key={pm.id} pm={pm} />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <p className="mb-2 text-sm font-medium text-zinc-700">Add a card</p>
        <p className="mb-4 text-xs text-zinc-500">
          To add a payment method, contact support or use the booking flow — card entry will be
          available inline when placing your next booking.
        </p>
        <p className="text-xs text-zinc-400">
          Card data is stored securely with Stripe and never touches our servers.
        </p>
      </div>
    </div>
  );
}
