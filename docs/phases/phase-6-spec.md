# Phase 6 — Core Booking Flow

## Goal

A customer can book an approved cleaner. The cleaner can accept or decline. Both parties can view and manage their bookings. No real Stripe payment in this phase — bookings start in `booking_requested` state directly (payment auth is a Phase 7 concern).

No new DB migrations — all tables exist.

---

## Acceptance criteria

- [ ] `/app/cleaners/[id]` has a "Book this cleaner" button
- [ ] `/app/cleaners/[id]/book` shows a booking form: service, address, date, time, duration
- [ ] Form shows live price preview (hourly rate × duration + platform fee)
- [ ] Submitting creates a booking in `booking_requested` state + `booking_state_events` record
- [ ] Customer is redirected to `/app/bookings/[id]` on success
- [ ] `/app/bookings` lists the customer's bookings (all states)
- [ ] `/app/cleaner` shows the cleaner's incoming requests + confirmed bookings
- [ ] Cleaner can accept (→ `confirmed`) or decline (→ `cleaner_declined`) a `booking_requested` booking
- [ ] Customer can cancel a `booking_requested` or `confirmed` booking (→ `cancelled_by_customer`)
- [ ] Nav updated: "My Bookings" for customers, "Dashboard" link visible
- [ ] `pnpm lint && pnpm typecheck && pnpm build` all pass

---

## Pricing (MVP — 20% commission)

```
hourly_rate_cents      = cleaner.hourly_rates_cents[service_type]
cleaner_subtotal_cents = hourly_rate_cents × duration_hours
platform_fee_cents     = round(cleaner_subtotal_cents × 0.20)
total_charge_cents     = cleaner_subtotal_cents + platform_fee_cents   ← constraint
cleaner_payout_cents   = cleaner_subtotal_cents                        ← cleaner keeps full base
commission_rate        = 0.200
```

---

## State transitions in Phase 6

```
booking_requested  →  confirmed          (cleaner accepts)
booking_requested  →  cleaner_declined   (cleaner declines)
booking_requested  →  cancelled_by_customer (customer cancels before cleaner responds)
confirmed          →  cancelled_by_customer (customer cancels after confirmation)
```

Every transition also inserts an append-only row in `booking_state_events`.

---

## Files

### New

| File | Description |
|---|---|
| `src/features/booking/validation.ts` | `createBookingSchema` |
| `src/features/booking/queries.ts` | `listServices`, `getMyBookingsAsCustomer`, `getMyBookingsAsCleaner`, `getBookingById`, `getMyCleanerProfileId` |
| `src/features/booking/actions.ts` | `createBookingAction`, `acceptBookingAction`, `declineBookingAction`, `cancelBookingAction` |
| `src/features/booking/components/BookingStateBadge.tsx` | State pill |
| `src/features/booking/components/BookingCard.tsx` | Card for list pages |
| `src/features/booking/components/BookingForm.tsx` | Client form (service/address/date/time/duration) |
| `src/app/(app)/app/cleaners/[id]/book/page.tsx` | Booking creation page |
| `src/app/(app)/app/bookings/page.tsx` | Customer bookings list |
| `src/app/(app)/app/bookings/[id]/page.tsx` | Customer booking detail |
| `src/app/(app)/app/cleaner/page.tsx` | Cleaner dashboard |
| `src/app/(app)/app/cleaner/bookings/[id]/page.tsx` | Cleaner booking detail |

### Modified

| File | Change |
|---|---|
| `src/app/(app)/app/cleaners/[id]/page.tsx` | Add "Book this cleaner" button |
| `src/app/(app)/layout.tsx` | Add "My Bookings" nav link |

---

## DB notes

- **INSERT bookings**: no INSERT RLS → must use admin (service-role) client
- **INSERT booking_state_events**: no INSERT RLS → must use admin client
- **UPDATE bookings state**: `bookings_update_party` allows UPDATE for parties → regular server client OK
- `customer_id` → `customer_profiles.id` (not `users.id`)
- `cleaner_id` → `cleaner_profiles.id` (not `users.id`)

---

## Definition of done

Phase 6 is complete when all acceptance criteria above are checked.
