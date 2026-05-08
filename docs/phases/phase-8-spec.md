# Phase 8 — Reviews & Disputes

## Goal

Build the full post-booking trust loop: customer reviews completed work, and if unhappy, files a dispute with a structured 3-tier resolution path (direct → escalation → admin mediation).

## Scope

### 8.1 — Booking completion lifecycle

Added the missing transitions that make disputes possible:

- **Cleaner "Mark job complete"** (`confirmed` → `awaiting_approval`)
- **Customer "Approve work"** (`awaiting_approval` → `approved`, sets `dispute_window_ends_at = NOW() + 48h`)

These intentionally skip GPS clock-in/clock-out and Stripe capture (Phase 9) to unblock the dispute and review flows.

### 8.2 — Reviews

- Customer can leave a 1–5 star review + optional text + trait chips after booking reaches `approved`/`paid`
- Trait chips pulled from `traits` table (seeded in B3)
- Review submitted via server action → immutable post-submission (DB trigger enforces)
- After submission, `cleaner_profiles.average_rating` and `review_count` recalculated and updated
- Review visible on cleaner profile page

**Routes:**
- `/app/bookings/[id]/review` — review submission form

### 8.3 — Dispute filing

- Customer files dispute within 48-hour window after approval
- Dispute captures: issue category, desired outcome, free-text description
- Booking state transitions to `disputed`; initial description becomes first dispute message
- 48-hour window tracked via `bookings.dispute_window_ends_at`

### 8.4 — Dispute thread + cleaner response

- Threaded conversation on dispute page (customer, cleaner, admin messages)
- Cleaner responds with one of 3 options: offer re-clean, offer partial refund, stand by work
- Response becomes a dispute message

### 8.5 — Customer accept/reject

- Customer accepts → `mutually_resolved`, booking → `dispute_resolved`
- Customer rejects → `escalated` for admin review

### 8.6 — Admin mediation

- Admin queue: `/app/admin/disputes` shows all open/escalated disputes
- Admin detail: `/app/admin/disputes/[id]` shows full thread + resolution form
- Admin resolves with: no refund / partial refund / full refund + notes
- Resolution message posted to thread; dispute → `admin_resolved`

## Routes added

| Route | Description |
|---|---|
| `/app/bookings/[id]/review` | Customer review form |
| `/app/bookings/[id]/dispute` | Customer dispute view/file |
| `/app/cleaner/bookings/[id]/dispute` | Cleaner dispute view/respond |
| `/app/admin/disputes` | Admin dispute queue |
| `/app/admin/disputes/[id]` | Admin mediation + resolve |

## What's NOT in Phase 8

- Stripe refund processing — disputes can be resolved but money movement is Phase 9
- Photo evidence upload — requires Supabase Storage setup
- Frivolous claim counter / automated warnings — Phase 9+
- Email/SMS notifications for dispute events — Phase 10
- Auto-expiry cron job — scaffold in Phase 9 with other Vercel Cron work

## Completion criteria

- [x] Customer can leave a review after booking is approved
- [x] Cleaner profile updates average_rating after review
- [x] Customer can file dispute within 48h window
- [x] Cleaner can respond to dispute
- [x] Customer can accept (mutually resolved) or reject (escalated)
- [x] Admin can resolve any open dispute
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass
