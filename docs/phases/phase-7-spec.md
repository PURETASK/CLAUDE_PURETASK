# Phase 7 — Payment Authorization (Stripe) Spec

> **Goal:** When a cleaner accepts a booking, authorize a hold on the customer's card. When the customer approves completed work, capture the hold and pay the cleaner via Stripe Connect.
> **Status:** Scaffolded with placeholders. Live integration blocked on Stripe keys.

---

## Acceptance criteria

- [ ] Customer can attach a payment method (Stripe Setup Intent UI) on first booking
- [ ] Accepting a booking transitions `confirmed → payment_authorized` after a successful PaymentIntent auth (manual capture)
- [ ] Failed auth → `payment_failed` with a clear customer error
- [ ] Customer approval of completed work captures the held funds (`payment_authorized → completed`)
- [ ] Cancellation before capture releases the hold (PaymentIntent.cancel)
- [ ] Cleaners complete Stripe Connect (Express) onboarding before they can be paid
- [ ] Stripe webhook endpoint verifies signatures and reconciles booking state
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` all pass

---

## State machine (additions)

```
booking_requested ─cleaner accept─► confirmed
confirmed         ─system auth───► payment_pending ─► payment_authorized | payment_failed
payment_authorized ─system────────► in_progress    ─► completed ─customer approve─► (capture)
payment_failed     ─customer retry► payment_pending
```

Unit tests for these transitions: [`src/features/booking/state-machine.test.ts`](../../src/features/booking/state-machine.test.ts).

---

## Files (current scaffold)

| File                                    | Status                                                         |
| --------------------------------------- | -------------------------------------------------------------- |
| `src/lib/stripe/client.ts`              | stub `getStripe()` with `isStripeConfigured()` guard           |
| `src/lib/stripe/types.ts`               | `PaymentIntentStatus`, `PaymentAuthResult`, etc.               |
| `src/lib/stripe/placeholders.ts`        | `authorize/capture/connectOnboarding` placeholders             |
| `src/features/payments/actions.ts`      | `authorizeBookingPaymentAction`, `captureBookingPaymentAction` |
| `src/app/api/webhooks/stripe/route.ts`  | 200/501 stub endpoint                                          |
| `src/features/booking/state-machine.ts` | full transition map incl. payment states                       |
| `.env.example`                          | `STRIPE_*` and `CHECKR_*` placeholders                         |

---

## When keys arrive — work plan

1. `pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js`
2. Replace `StripeStub` in `src/lib/stripe/client.ts` with real `new Stripe(env.STRIPE_SECRET_KEY)` import
3. Implement real bodies in `src/lib/stripe/` (delete `placeholders.ts` or move under `__tests__/fixtures`)
4. Add SetupIntent + PaymentMethod attach UI for customers (TanStack Query + Stripe Elements)
5. Implement Stripe Connect Express account creation + onboarding link in cleaner application flow
6. Wire webhook handlers: `payment_intent.amount_capturable_updated`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`
7. Add migration if any new payment columns required (current schema's `payments` table from B5 should suffice — verify)
8. Add unit tests around capture/refund branches
9. Manual E2E with Stripe test cards (4242…, decline cards, 3DS cards)

---

## Out of scope (defer to later phases)

- Photo verification / GPS check-in (Phase 8)
- Reviews & disputes (Phase 9)
- Real Checkr background check kickoff (Phase 10)
- Payouts schedule + reconciliation dashboard (Phase 11)
