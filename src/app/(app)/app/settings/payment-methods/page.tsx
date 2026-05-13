import Image from 'next/image';
import Link from 'next/link';

import { PaymentMethodCard } from '@/features/payments/components/PaymentMethodCard';
import { getMyPaymentMethods } from '@/features/payments/queries';
import { BACKGROUNDS, ICONS } from '@/lib/assets';

export default async function PaymentMethodsPage() {
  const methods = await getMyPaymentMethods();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header with wallet background */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-tier1">
        <Image src={BACKGROUNDS.walletBg} alt="" fill className="object-cover opacity-20" />
        <div className="relative z-10 px-6 py-6">
          <Link
            href="/app/settings"
            className="mb-2 block text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← Back to settings
          </Link>
          <div className="flex items-center gap-3">
            <Image
              src={ICONS.wallet}
              alt=""
              width={52}
              height={52}
              className="rounded-xl drop-shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Payment methods</h1>
              <p className="text-sm text-neutral-500">
                Cards are used to pay for bookings. A default card is required to book.
              </p>
            </div>
          </div>
        </div>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center shadow-tier1">
          <Image
            src={ICONS.wallet}
            alt=""
            width={56}
            height={56}
            className="mx-auto mb-3 rounded-xl opacity-50"
          />
          <p className="font-medium text-neutral-600">No payment methods saved yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Add a card below to start booking cleaners.
          </p>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {methods.map((pm) => (
            <PaymentMethodCard key={pm.id} pm={pm} />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-tier1">
        <p className="mb-2 text-sm font-semibold text-neutral-700">Add a card</p>
        <p className="mb-3 text-xs text-neutral-500">
          Card entry is available inline when placing your next booking.
        </p>
        <p className="flex items-center gap-1.5 text-xs text-neutral-400">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-5a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>
          Card data is stored securely with Stripe and never touches our servers.
        </p>
      </div>
    </div>
  );
}
