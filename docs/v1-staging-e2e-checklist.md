# V1 Staging — End-to-End Test Checklist

Run on **staging** with real Stripe test mode, Checkr test/sandbox, and three test accounts: **customer**, **cleaner**, **admin**.

Record: date, tester, build/commit SHA, pass/fail per section, P0 blocker notes.

**Prerequisites:** [v1-staging-env-checklist.md](./v1-staging-env-checklist.md) complete.

---

## P0 — Core marketplace path

### A. Customer onboarding

| # | Step | Expected | Pass |
| --- | --- | --- | --- |
| A1 | Sign up new email | Verification email or dev bypass works | ☐ |
| A2 | Confirm email, sign in | Session cookie set | ☐ |
| A3 | `/onboarding/role-select` → Customer | `role_confirmed` true; redirect to `/app` | ☐ |
| A4 | Add address in settings | Row in `addresses`; geocode if Maps key set | ☐ |
| A5 | Accept photo policy if prompted | Policy acceptance stored | ☐ |

### B. Cleaner supply (parallel account)

| # | Step | Expected | Pass |
| --- | --- | --- | --- |
| B1 | Sign up cleaner account | Same auth flow | ☐ |
| B2 | Role = Cleaner | Lands on cleaner home, not customer bookings | ☐ |
| B3 | Start application, save draft steps | Draft persists on reload | ☐ |
| B4 | Complete Checkr consent flow | Candidate created; webhook updates status | ☐ |
| B5 | Stripe Identity session | Webhook sets verification state | ☐ |
| B6 | Stripe Connect onboarding | `charges_enabled` / account linked via webhook | ☐ |
| B7 | Submit application | Status submitted; visible in admin queue | ☐ |
| B8 | **Admin** approves application | Cleaner can accept jobs | ☐ |
| B9 | Set availability + service area | Browse shows cleaner to customer | ☐ |

### C. Book → execute → pay

| # | Step | Expected | Pass |
| --- | --- | --- | --- |
| C1 | Customer browses `/app/cleaners` | Approved cleaner visible | ☐ |
| C2 | Open profile, start booking | Booking created; state event logged | ☐ |
| C3 | Payment method attached / charge authorized | Stripe + `charges` row consistent | ☐ |
| C4 | Cleaner accepts booking | State → `confirmed` (or equivalent) | ☐ |
| C5 | Cleaner marks on the way / check-in | GPS or state per spec | ☐ |
| C6 | Cleaner uploads job photos + marks complete | Photos stored; awaiting approval | ☐ |
| C7 | Customer approves work | Payment captured; booking terminal state | ☐ |
| C8 | Payout line item exists for cleaner | Visible in earnings; weekly cron optional test | ☐ |

### D. Failure paths (minimum)

| # | Step | Expected | Pass |
| --- | --- | --- | --- |
| D1 | Customer cancels before job (policy window) | Correct fee/refund per policy | ☐ |
| D2 | Customer files dispute after job | Dispute row + thread | ☐ |
| D3 | Admin resolves dispute | Resolution recorded; audit in `admin_actions` | ☐ |
| D4 | Customer opens support ticket | Ticket + admin reply | ☐ |

---

## P1 — Should work; not launch-blocking alone

| # | Area | Pass |
| --- | --- | --- |
| P1-1 | Notifications inbox (in-app) | ☐ |
| P1-2 | Booking messages thread | ☐ |
| P1-3 | Review + tip after completion | ☐ |
| P1-4 | Auto-approve cron (job left in awaiting_approval past due) | ☐ |
| P1-5 | Marketing pages load (`/`, `/pricing`, `/coverage`) | ☐ |
| P1-6 | Middleware blocks customer from `/app/cleaner/*` and vice versa | ☐ |

---

## P2 — Post-launch

See [v1-post-launch-backlog.md](./v1-post-launch-backlog.md): recurring, favorites, full SEO landings, native push, etc.

---

## Sign-off

| Role | Name | Date | Approved |
| --- | --- | --- | --- |
| Engineering | | | ☐ |
| Founder | | | ☐ |

**P0 rule:** Any failed row in sections A–D blocks v1 launch until fixed or explicitly descoped in `v1-launch-scope.md` with founder sign-off.
