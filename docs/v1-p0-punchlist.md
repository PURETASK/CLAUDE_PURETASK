# V1 P0 Punchlist — pre-staging audit findings

**Generated:** 2026-06-19 (static code audit against [v1-staging-e2e-checklist.md](./v1-staging-e2e-checklist.md))
**Build health at time of audit:** `pnpm lint` ✅ · `typecheck` ✅ · `test` 47 ✅ · `build` ✅ (154 pages)

> **Why this exists:** the build is green, but a green build only proves types + syntax. A code-level trace of every P0 user-journey row found that the external-vendor touchpoints and the unattended money-movement edges are stubbed or broken. These would fail the staging E2E run — and several lose money silently rather than erroring. Fix these **before** spending vendor money standing up staging.

**Severity key:** 🔴 launch-blocking · 🟠 security/integrity · 🟡 drift/landmine
**Batch key:** B1 = pure code, no vendor accounts needed · B2 = needs a policy/design decision · B3 = paired with vendor onboarding (deferred until accounts exist)

---

## Resolution status (updated 2026-06-19)

| Item | Status | Where |
|---|---|---|
| P0-1, P0-2, P0-4 auto-approval money path | ✅ Fixed | Batch 1 (#36) |
| P0-5 currency · P0-7 auth callback · P0-9 accept gate · P0-11 tax env · P0-12 signin redirect | ✅ Fixed | Batch 1 (#36) |
| P0-3 payment webhook reconciliation · P0-6 cancellation refunds | ✅ Fixed | Batch 2 (#37) |
| P0-13 capture-less landmine (all approve paths now capture) | ✅ Fixed | Batch 2 (#37) |
| P0-10 service-area write-on-approval | ✅ Fixed | Batch 2 (#37) |
| OPS-1 migration 0017 | ✅ Applied to live Supabase | — |
| P0-13 UI consolidation of the duplicate screens | ⏳ Follow-up (needs product decision) | issue #34 |
| P0-10 browse ZIP filter + cleaner service-area editor | ⏳ Follow-up (pure code) | issue #31 |
| P0-8a/b/c Checkr / Identity / Connect wiring | ⏳ Batch 3 (paired with vendor onboarding) | issues #27 #28 #29 |

**Separate pre-launch DB hardening pass (all Supabase-linter WARN, none blocking):** `function_search_path_mutable` on ~15 functions (the new helper hardened in migration `0018`); `extension_in_public` (citext / btree_gist / cube / earthdistance); SECURITY DEFINER functions executable via RPC by anon/authenticated (`is_admin`, `current_*_id`, `handle_*` triggers); leaked-password protection disabled in Auth. Worth a dedicated pass before public launch.

---

## Money path

| ID | Sev | Batch | Issue | Evidence | Status |
|----|-----|-------|-------|----------|--------|
| P0-1 | 🔴 | B1 | **Auto-approval takes no money and never pays the cleaner.** `auto_approved` is treated as paid/terminal everywhere (admin revenue, tips, reviews), but the cron only writes a state event — no PaymentIntent capture, no payout line item. Any customer who ignores a job for 24h → card hold expires uncaptured **and** cleaner unpaid. Single largest risk. | `api/cron/auto-approve/route.ts:28`, `booking/lib/booking-states.ts:97` | ☐ |
| P0-2 | 🔴 | B1 | **Auto-approve cron isn't scheduled** in `vercel.json` (only weekly-payout + nightly-reliability). It never fires; jobs sit in `awaiting_approval` forever. Also auth-header inconsistency (`Bearer` vs `x-cron-secret`). | `vercel.json` | ☐ |
| P0-3 | 🔴 | B2 | **No Stripe `payment_intent.*` / `charge.refunded` webhook reconciliation** — the Connect webhook only handles `account.updated`. Ledger can silently drift from Stripe; no 3DS/`requires_action` handling on `off_session`. | `webhooks/stripe-connect` handler | ☐ |
| P0-4 | 🔴 | B1 | **Capture failure is swallowed** (empty catch) — booking flips to `paid` + payout created even if `capture()` threw. | `disputes/actions.ts:134` | ☐ |
| P0-5 | 🔴 | B1 | **`currency: 'U'`** (truncated, should be `'usd'`) on both refund-insert paths — every refund row malformed. | `admin/actions/refund-actions.ts:35`, `disputes/actions.ts:550` | ☐ |
| P0-6 | 🔴 | B2 | **Cancellation (D1) moves no money** — live `cancelBookingAction` only flips state; the real penalty engine (`calculateCancellationPenalty`) + `lifecycle.cancelBooking` are dead code; no `refunds.create` anywhere. The policy table shown to customers is cosmetic. | `booking/actions.ts:396`, `lib/cancellation-policy.ts` (unused) | ☐ |

## Auth

| ID | Sev | Batch | Issue | Evidence | Status |
|----|-----|-------|-------|----------|--------|
| P0-7 | 🔴 | B1 | **No email-confirmation callback route.** `emailRedirectTo` points at a static page; nothing exchanges the `code`/`token_hash` for a session. New users can't verify → can't sign in. No dev bypass either. Blocks the entire funnel at step 1. | `auth/verify-email/page.tsx`; missing `/auth/confirm` | ☐ |

## Vendor integrations (all three stubbed — B4/B5/B6)

| ID | Sev | Batch | Issue | Evidence | Status |
|----|-----|-------|-------|----------|--------|
| P0-8a | 🔴 | B3 | **Checkr non-functional.** `CheckrLauncher` is a literal stub button; `createCheckrCandidateAction` persists nothing; webhook `UPDATE … WHERE external_check_id = …` matches **zero rows** (nothing ever writes that id) and hardcodes `'clear'` regardless of result; timing-unsafe signature compare; placeholder FCRA consent (legal). | `cleaner/checkr/*`, `webhooks/checkr`, `lib/checkr/webhooks.ts:13` | ☐ |
| P0-8b | 🔴 | B3 | **Stripe Identity webhook overwrites the whole `application_data` JSONB** (wipes the multi-step draft) instead of merging; handles only `verified`; session id never persisted on create. | `cleaner/identity/webhook-handler.ts:12`, `identity/actions.ts:11` | ☐ |
| P0-8c | 🔴 | B3 | **Stripe Connect** launcher is a stub; account id never persisted; webhook marks onboarding "complete" on any `account.updated` **without checking `charges_enabled`/`payouts_enabled`/`details_submitted`** (those strings appear nowhere in the codebase). | `cleaner/connect/*`, `webhooks/stripe-connect` | ☐ |

> **Root cause (all of P0-8):** the launcher/create-actions return external IDs to the *client* but never persist them server-side, while the webhooks reconcile *by those exact IDs* — so even with correct signature verification, every webhook updates zero rows.

## Security / integrity

| ID | Sev | Batch | Issue | Evidence | Status |
|----|-----|-------|-------|----------|--------|
| P0-9 | 🟠 | B1 | **`acceptBookingAction` gates on nothing** — any authenticated user can accept any booking (no approved-profile / clear-check / ownership check). | `booking/actions.ts:223` | ☐ |
| P0-10 | 🟠 | B2 | **Cleaners are invisible-by-availability.** No service-area save path exists (`cleaner_service_zips` is read-only); `browseCleaners` ignores availability + zip coverage; availability ranking hardcoded to `1`. Setting availability changes nothing. | `discovery/queries.ts:147`, `match-score.ts:59` | ☐ |

## Drift / landmines

| ID | Sev | Batch | Issue | Evidence | Status |
|----|-----|-------|-------|----------|--------|
| P0-11 | 🟡 | B1 | **`TAX_ENCRYPTION_KEY` not in `env.ts`** — checklist lists it required, but it's consumed via raw `process.env` with a non-null assertion. Silent at boot, **crashes at runtime** when tax storage runs. | `lib/encryption.ts:9`, `lib/env.ts` | ☐ |
| P0-12 | 🟡 | B1 | **`signInAction` sends everyone to `/app`** (customer home) — returning cleaners land on the wrong page. | `auth/actions.ts:49` | ☐ |
| P0-13 | 🟡 | B2 | **Duplicate competing state machines** — 3 `approveBookingAction` variants (only the disputes one captures) + 2 job-flow implementations. Capture-less dead variants are landmines if any UI repoints to them. | `disputes/actions.ts`, `verification/actions.ts:318`, `booking/actions/job-flow.ts:102` | ☐ |

## Operational (not code)

| ID | Sev | Issue | Status |
|----|-----|-------|--------|
| OPS-1 | 🔴 | Migration `0017_phase6d_photos_bucket_rls.sql` not yet applied to the live Supabase project. | ☐ |

---

## What genuinely passes (do not touch)

The **manual happy path is launch-quality**: browse → book → authorize (manual capture ✓) → cleaner accepts → on-the-way + geofence → photos/clock-out gate → **manual** customer approve → capture → payout line item → weekly payout cron. Plus, verified end-to-end:

- Customer onboarding: role-select (`role_confirmed`), address + conditional geocode, photo-policy + waiver
- Disputes: filing (D2), admin resolution with `admin_actions` audit (D3)
- Support tickets + admin reply (D4)
- In-app notifications inbox, realtime booking messaging, reviews + tips (real Stripe PI)
- Marketing pages (`/`, `/pricing`, `/coverage` — data-driven)
- All three webhooks **do** verify signatures (Identity + Connect via `constructEvent`; Checkr weakly)
- Middleware role gating blocks customer↔cleaner cross-access (allowlist-based)

---

## Remediation sequence

- **Batch 1 (pure code, no vendor accounts):** P0-7, P0-1, P0-2, P0-4, P0-5, P0-9, P0-11, P0-12
- **Batch 2 (needs a decision):** P0-6, P0-3, P0-13, P0-10
- **Batch 3 (paired with vendor onboarding — deferred until Checkr/Stripe accounts exist):** P0-8a, P0-8b, P0-8c

**Not started until P0s clear:** no new feature work while P0 rows are open (per [v1-launch-scope.md](./v1-launch-scope.md) review cadence).

---

## Method note

This is a **static code audit** — findings are evidence-based (file:line) but not runtime-confirmed. Confirm each against a live run where feasible. The audit was scoped to the P0/P1 rows of the staging E2E checklist; it is not an exhaustive review of every module.
