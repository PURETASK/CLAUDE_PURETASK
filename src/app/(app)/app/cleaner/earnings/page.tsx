import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';

import { InstantPayoutButton } from '@/features/payments/components/InstantPayoutButton';
import { PayoutStateBadge } from '@/features/payments/components/PayoutStateBadge';
import { getMyCleanerEarnings } from '@/features/payments/queries';

const fmtPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default async function CleanerEarningsPage() {
  const data = await getMyCleanerEarnings();
  if (!data) notFound();

  const {
    pendingBalanceCents,
    pendingItems,
    payouts,
    stripeConnectAccountId,
    instantPayoutEnabled,
  } = data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/app/cleaner" className="mb-1 block text-xs text-zinc-400 hover:text-zinc-600">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Earnings</h1>
        <p className="text-sm text-zinc-500">
          Free payouts every Friday. Instant payouts available with a 5% fee.
        </p>
      </div>

      {/* Pending balance */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Pending balance
        </p>
        <p className="text-3xl font-semibold text-zinc-900">{fmtPrice(pendingBalanceCents)}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Paid out every Friday at noon Pacific. Next Friday:{' '}
          {(() => {
            const d = new Date();
            const diff = (5 - d.getDay() + 7) % 7 || 7;
            d.setDate(d.getDate() + diff);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          })()}
        </p>
      </section>

      {/* Pending line items breakdown */}
      {pendingItems.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Pending earnings breakdown</h2>
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-zinc-700">{item.description}</p>
                  <p className="text-xs text-zinc-400">{fmtDate(item.earned_at)}</p>
                </div>
                <span className="text-sm font-medium text-zinc-900">
                  {fmtPrice(item.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instant payout */}
      {instantPayoutEnabled && (
        <section className="mb-6">
          <InstantPayoutButton
            pendingCents={pendingBalanceCents}
            hasConnectAccount={!!stripeConnectAccountId}
          />
        </section>
      )}

      {!instantPayoutEnabled && (
        <section className="mb-6 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
          Instant payouts are disabled. Enable them in{' '}
          <Link href="/app/cleaner/settings" className="underline hover:text-zinc-800">
            settings
          </Link>
          .
        </section>
      )}

      {/* Payout history */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Payout history</h2>
        {payouts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-tier1">
            <EmptyState
              showDash
              title="No payouts yet"
              description="Complete your first job and your earnings will show up here on the next Friday payout."
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {fmtPrice(payout.net_amount_cents)}
                    {payout.is_instant && (
                      <span className="ml-2 text-xs text-zinc-400">(instant)</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {fmtDate(payout.initiated_at)}
                    {payout.period_start_at && payout.period_end_at && (
                      <>
                        {' '}
                        · {fmtDate(payout.period_start_at)} – {fmtDate(payout.period_end_at)}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {payout.instant_fee_cents > 0 && (
                    <span className="text-xs text-zinc-400">
                      fee {fmtPrice(payout.instant_fee_cents)}
                    </span>
                  )}
                  <PayoutStateBadge state={payout.state} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
