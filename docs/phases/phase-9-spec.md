# Phase 9 — Money Operations

## Goal

Wire up the full payment loop: tier-aware commission calculation, Stripe charge authorization on booking creation, capture on customer approval, weekly Friday payout batch to cleaners via Stripe Connect, instant payout option, cleaner earnings dashboard, and customer receipt.

## Scope

### 9.1 — Tier-aware commission engine

Commission rate is no longer a flat 20% — it depends on cleaner tier and, for Rising Pro, job count:

| Tier | Condition | Commission |
|---|---|---|
| Rising Pro | first 6 completed jobs (`completed_booking_count < 6`) | **12%** |
| Rising Pro | after first 6 jobs (`completed_booking_count >= 6`) | 15% |
| Proven Specialist | — | 13% |
| Top Performer | — | 11% |
| All-Star Expert | — | 10% |

- `getCommissionRate(tier, completedBookingCount)` pure function in `pricing.ts`
- `createBookingAction` fetches `cleaner_profiles.completed_booking_count` and passes it to rate lookup
- `commission_rate_at_booking` on the `bookings` row is now the true tier-aware rate (no longer always 0.2)
- Tests updated to cover all 5 rate bands

### 9.2 — Payment method management (customer)

Customers must have a saved card before booking.

- Route: `/app/settings/payment-methods`
- Add card via Stripe SetupIntent (server action creates the intent, client confirms with Stripe.js, webhook or return URL saves the PM)
- For Phase 9 simplicity: use a direct `stripe.paymentMethods.attach` flow instead of full SetupIntent UI — customers enter card details via Stripe API and the PM is saved
- List saved cards with default indicator
- Set default / delete

Database: `payment_methods` table (already in schema). First PM creation also creates the Stripe Customer object and stores `stripe_customer_id` on the row.

### 9.3 — Charge authorization on booking creation

When a booking is created:

1. Look up customer's default `payment_methods` row
2. Create `stripe.paymentIntents.create({ capture_method: 'manual', confirm: true, ... })`
3. Insert `charges` row in `authorized` state
4. If PI fails → return error to user, no booking created

The booking is created with the `charges` record linked. This replaces the current no-payment flow.

**Fallback**: If customer has no default payment method, creation fails with a clear message directing to `/app/settings/payment-methods`.

### 9.4 — Charge capture on approval

When customer calls `approveBookingAction`:

1. Find the `charges` row for this booking
2. Call `stripe.paymentIntents.capture(stripe_payment_intent_id)`
3. Update `charges` row: `state = 'captured'`, `captured_at = NOW()`
4. Move booking to `paid` state
5. Insert `payout_line_items` row for cleaner (amount = `cleaner_payout_cents`)
6. Increment `customer_profiles.total_spent_cents`

### 9.5 — Weekly payout batch (Vercel Cron)

Route: `POST /api/cron/weekly-payout`  
Schedule: `0 20 * * 5` (every Friday noon Pacific = 20:00 UTC)

Logic:
1. Find all cleaners with unpaid `payout_line_items` (where `payout_id IS NULL`)
2. For each cleaner, sum the line items to get `amount_cents`
3. Check cleaner has `stripe_connect_account_id`
4. Create `payouts` row (state = `pending`)
5. Create `stripe.transfers.create({ destination: connect_account_id, amount: net_cents })`
6. Update `payouts` row: `stripe_payout_id`, `state = 'in_transit'`, `in_transit_at`
7. Update `payout_line_items` rows: `payout_id = payout.id`

Protected by `CRON_SECRET` header check.

### 9.6 — Instant payout

- Cleaner can toggle `instant_payout_enabled` on settings
- Earnings dashboard has "Get paid now" button (only if eligible: has connect account + unpaid line items)
- `requestInstantPayoutAction`: same as batch but immediate, `is_instant = true`
- `instant_fee_cents = ROUND(amount_cents * 0.05)`
- `net_amount_cents = amount_cents - instant_fee_cents`
- Transfer uses `method: 'instant'` on the Stripe payout (requires enabled instant payouts on connect account)

### 9.7 — Cleaner earnings dashboard

Route: `/app/cleaner/earnings`

Sections:
- **Pending balance** — sum of unpaid `payout_line_items`, per-booking breakdown
- **Payout history** — table of `payouts` with state badge, amount, date
- **Instant payout CTA** — shown if pending balance > 0 and connect account ready

### 9.8 — Customer receipt

Route: `/app/bookings/[id]/receipt`

Shows:
- Booking number, date, cleaner name
- Pricing breakdown (subtotal + platform fee + total)
- Charge status (authorized / captured / refunded)
- Payment method (card brand + last 4)
- Timestamps (authorized_at, captured_at)

## Routes added

| Route | Description |
|---|---|
| `/app/settings/payment-methods` | Customer payment method management |
| `/app/cleaner/earnings` | Cleaner earnings + payout dashboard |
| `/app/bookings/[id]/receipt` | Customer payment receipt |
| `/api/cron/weekly-payout` | Friday payout batch (Vercel Cron) |

## What's NOT in Phase 9

- $15 first-cleaning apology credit — needs `apology_credits` DB table (Phase 10 migration)
- Stripe webhook handler for async PI events — charge state updated synchronously here
- Refund processing from disputes — admin manually handles in Stripe dashboard until Phase 10
- Payment method add UI with Stripe.js Elements — using server-side attach for simplicity

## Completion criteria

- [x] `getCommissionRate` returns correct rate for all 5 bands
- [x] Booking creation fails without a default payment method
- [x] Booking creation creates a Stripe PaymentIntent and `charges` row
- [x] Approving work captures the PaymentIntent and moves booking to `paid`
- [x] `payout_line_items` created on capture
- [x] Weekly payout cron groups and transfers line items to cleaners
- [x] Instant payout deducts 5% fee and transfers immediately
- [x] `/app/cleaner/earnings` shows pending balance + payout history
- [x] `/app/bookings/[id]/receipt` shows charge state + payment method
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass
