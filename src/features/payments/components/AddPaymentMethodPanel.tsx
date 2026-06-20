'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { IntegrationNotice } from '@/components/shared/IntegrationNotice';
import { BubbleDrawer } from '@/features/experience/components/BubbleDrawer';
import { INTEGRATION_MESSAGES } from '@/lib/integrations';

type Props = {
  stripeReady: boolean;
};

export const AddPaymentMethodPanel = ({ stripeReady }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white/90 p-5 shadow-tier1">
        <p className="mb-2 text-sm font-semibold text-neutral-700">Add a card</p>
        <p className="mb-3 text-xs text-neutral-500">
          Save a card for faster checkout when you book a cleaner.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={!stripeReady}
          onClick={() => setOpen(true)}
        >
          Add payment method
        </Button>
        {!stripeReady && (
          <p className="mt-2 text-xs text-neutral-400">{INTEGRATION_MESSAGES.stripe}</p>
        )}
      </div>

      <BubbleDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Add a payment method"
        description="Cards are saved securely with Stripe."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Link
              href="/app/cleaners"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-tier1 transition-all hover:brightness-110"
            >
              Book a cleaner to add card
            </Link>
          </div>
        }
      >
        {!stripeReady && (
          <IntegrationNotice title="Stripe not configured">
            {INTEGRATION_MESSAGES.stripe}
          </IntegrationNotice>
        )}
        <p className="text-sm text-neutral-600">
          When you complete your first booking, you&apos;ll enter card details at checkout. That
          card is saved to your account for future bookings.
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Card data never touches PureTask servers — Stripe handles storage and PCI compliance.
        </p>
      </BubbleDrawer>
    </>
  );
};
