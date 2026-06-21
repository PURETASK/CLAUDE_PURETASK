import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
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

  const nextFriday = (() => {
    const d = new Date();
    const diff = (5 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>

      {/* Available balance */}
      <Card elevation={1} className="border border-neutral-200 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          Available now
        </p>
        <p className="mt-1 text-3xl font-bold text-neutral-900">{fmtPrice(pendingBalanceCents)}</p>
        <p className="mt-1 text-xs text-neutral-400">
          Free payout every Friday · next {nextFriday}. Instant payout available for a 5% fee.
        </p>
        {instantPayoutEnabled ? (
          <div className="mt-4">
            <InstantPayoutButton
              pendingCents={pendingBalanceCents}
              hasConnectAccount={!!stripeConnectAccountId}
            />
          </div>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">
            Enable instant payouts in{' '}
            <Link href="/app/cleaner/settings" className="text-brand-600 hover:text-brand-700">
              settings
            </Link>
            .
          </p>
        )}
      </Card>

      {/* Pending breakdown */}
      {pendingItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Pending earnings" />
          <Card
            elevation={1}
            className="divide-y divide-neutral-100 border border-neutral-200 px-4"
          >
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-neutral-700">{item.description}</p>
                  <p className="text-xs text-neutral-400">{fmtDate(item.earned_at)}</p>
                </div>
                <span className="flex-shrink-0 text-sm font-medium text-neutral-900">
                  {fmtPrice(item.amount_cents)}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Payout history */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Payout history" />
        {payouts.length === 0 ? (
          <Card elevation={1} className="border border-neutral-200">
            <EmptyState
              showDash
              title="No payouts yet"
              description="Complete your first job and your earnings show up here on the next Friday payout."
            />
          </Card>
        ) : (
          <Card
            elevation={1}
            className="divide-y divide-neutral-100 border border-neutral-200 px-4"
          >
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    {fmtPrice(payout.net_amount_cents)}
                    {payout.is_instant && (
                      <span className="ml-2 text-xs text-neutral-400">(instant)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    {fmtDate(payout.initiated_at)}
                    {payout.period_start_at && payout.period_end_at && (
                      <>
                        {' '}
                        · {fmtDate(payout.period_start_at)} – {fmtDate(payout.period_end_at)}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  {payout.instant_fee_cents > 0 && (
                    <span className="text-xs text-neutral-400">
                      fee {fmtPrice(payout.instant_fee_cents)}
                    </span>
                  )}
                  <PayoutStateBadge state={payout.state} />
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
