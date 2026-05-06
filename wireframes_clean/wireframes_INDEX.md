# PureTask — Wireframe Index (Canonical)

**Status:** Canonical reference — single source of truth for which file contains which wireframe.
**Total coverage:** 68 main wireframes (WF 1–11 + WF 14–70) plus 10 sub-screens.
**Deferred:** WF 12, WF 13 (intentionally not built per Master Guide).

---

## How to use this document

When you (or Claude Code, or a contractor) need to find a specific wireframe:

1. Look up the WF# in the **per-file detailed listing** below
2. Open the file listed
3. Inside the file, search for `WIREFRAME N` or `<!-- WN:` (depending on file)

When starting work on a build phase, use the **phase reverse lookup** at the bottom to find every wireframe relevant to that phase.

If a file gets renamed in the future, update the **Quick reference table** here only. The detailed listing references files by their WF range, so it stays correct as long as you don't change *which* WFs each file contains.

---

## Quick reference table

| File | WF range | Screens | Notes |
|---|---|---|---|
| `wireframes_wf001-007.html` | 1, 2, 3, 4, 5, 6, 7 | 14 (incl. sub-screens) | Customer homepage + cleaner core. v3 expanded. |
| `wireframes_wf008-011.html` | 8, 9, 10, 11 | 4 | Customer discovery + post-booking. |
| *(WF 12, 13 deferred)* | — | — | Intentionally not built. |
| `wireframes_wf014-020.html` | 14, 15, 16, 17, 18, 19, 20 | 7 | Reschedule, cancel, dispute, messaging, review. |
| `wireframes_wf021-027.html` | 21, 22, 23, 24, 25, 26, 27 | 7 | Recurring + post-job + favorites + cleaner profile/calendar. |
| `wireframes_wf028-032.html` | 28, 29, 30, 31, 32 | 5 | Settings + insurance upload. |
| `wireframes_wf033-039.html` | 33, 34, 35, 36, 37, 38, 39 | 7 | Onboarding tail + recovery + verification + empty/error states. |
| `wireframes_wf040-046.html` | 40, 41, 42, 43, 44, 45, 46 | 9 (incl. 40a/b/c) | Loading states + marketing pages. |
| `wireframes_wf047-053.html` | 47, 48, 49, 50, 51, 52, 53 | 7 | Support, tours, training, score explainers. |
| `wireframes_wf054-060.html` | 54, 55, 56, 57, 58, 59, 60 | 7 | Admin tools. |
| `wireframes_wf061-070.html` | 61, 62, 63, 64, 65, 66, 67, 68, 69, 70 | 10 | Specialty surfaces + badges + Stripe Connect + waitlist. |

**Archived (do not use for build):** `wireframes_archive/wireframes_wf001-005_v1_archived.html`, `wireframes_archive/wireframes_wf001-006_v2_archived.html`. These are earlier drafts of Batch 1 that were strictly superseded by v3. Kept for design history only.

---

## Per-file detailed listing

### `wireframes_wf001-007.html` — Customer homepage + cleaner core (v3)

| WF | Title | Phase |
|---|---|---|
| 1 | Customer homepage (mobile) | Phase 5 |
| 2 | Cleaner dashboard (tightened) | Phase 5 (build with 5) |
| 2b | Cleaner dashboard — empty state (new cleaner) | Phase 5 |
| 2c | Score breakdown deep-dive | Phase 7 |
| 2d | Dashboard probation state | Phase 7 |
| 3 | Cleaner job inbox | Phase 6c |
| 3b | Cleaner job inbox — empty state | Phase 6c |
| 4 | "On my way" screen | Phase 6d |
| 4b | "On my way" — arrived state | Phase 6d |
| 5 | Cleaner active job screen | Phase 6e |
| 5b | Active job — ready to clock out | Phase 6e |
| 6 | Cleaner earnings & payouts | Phase 9 |
| 6b | Earnings — empty state (new cleaner) | Phase 9 |
| 7 | Cleaner profile · customer-facing view | Phase 5 |

### `wireframes_wf008-011.html` — Customer discovery + post-booking

| WF | Title | Phase |
|---|---|---|
| 8 | Cleaner list page | Phase 5 |
| 9 | Customer active job tracker | Phase 6e |
| 10 | Approve & pay screen | Phase 6f |
| 11 | Customer dashboard | Phase 5 |

### `wireframes_wf014-020.html` — Reschedule, cancel, dispute, messaging, review

| WF | Title | Phase |
|---|---|---|
| 14 | Reschedule flow | Phase 6 (post-MVP add-on) |
| 15 | Cancel flow with penalty disclosure | Phase 6 (post-MVP add-on) |
| 16 | Dispute filing (customer) | Phase 8 |
| 17 | Dispute response (cleaner) | Phase 8 |
| 18 | In-app messaging thread | Phase 6b |
| 19 | Notification center | Phase 10 |
| 20 | Review prompt with optional tip | Phase 6f (review immediately after approve) |

### `wireframes_wf021-027.html` — Recurring + post-job

| WF | Title | Phase |
|---|---|---|
| 21 | Recurring booking setup | Phase 6g |
| 22 | Recurring management | Phase 6g |
| 23 | Tip prompt (standalone) | Phase 6f |
| 24 | Auto-rebook nudge | Phase 6g |
| 25 | Customer favorites management | Phase 5 (lightweight; can defer) |
| 26 | Cleaner profile editor | Phase 4 |
| 27 | Cleaner availability calendar | Phase 4 / 6c |

### `wireframes_wf028-032.html` — Settings + account

| WF | Title | Phase |
|---|---|---|
| 28 | Customer settings | Phase 3 |
| 29 | Customer privacy settings | Phase 3 |
| 30 | Cleaner settings | Phase 4 |
| 31 | Cleaner profile settings | Phase 4 |
| 32 | Insurance Verified upload flow | Phase 7 (badge system) |

### `wireframes_wf033-039.html` — Onboarding tail + states

| WF | Title | Phase |
|---|---|---|
| 33 | Background check status | Phase 4 |
| 34 | Tax info collection | Phase 4 |
| 35 | Forgot password / account recovery | Phase 2 |
| 36 | Email verification | Phase 2 |
| 37 | Push notification permission | Phase 2 |
| 38 | Empty states (multiple contexts) | Phase 10 (referenced throughout) |
| 39 | Error states (multiple contexts) | Phase 10 (referenced throughout) |

### `wireframes_wf040-046.html` — Loading states + marketing

| WF | Title | Phase |
|---|---|---|
| 40a | Loading — cleaner dashboard | Phase 10 |
| 40b | Loading — cleaner list | Phase 10 |
| 40c | Loading — active job photo upload | Phase 10 |
| 41 | City × Service SEO landing | Phase 10 (deferrable post-launch) |
| 42 | Pricing page | Phase 10 |
| 43 | About page | Phase 10 |
| 44 | Help center index | Phase 10 |
| 45 | FAQ page | Phase 10 |
| 46 | Coverage page | Phase 10 |

### `wireframes_wf047-053.html` — Support, tours, training, explainers

| WF | Title | Phase |
|---|---|---|
| 47 | Contact / Support | Phase 10 |
| 48 | Customer first-time tour | Phase 10 |
| 49 | Cleaner photo etiquette training | Phase 4 (gated onboarding step) |
| 50 | Cleaner platform tour | Phase 10 |
| 51 | Tier system explainer | Phase 7 |
| 52 | Reliability score explainer | Phase 7 |
| 53 | Score change notification states (4) | Phase 7 |

### `wireframes_wf054-060.html` — Admin tools

| WF | Title | Phase |
|---|---|---|
| 54 | Admin dashboard / daily metrics | Phase 4 (admin tooling) |
| 55 | Cleaner application queue | Phase 4 |
| 56 | Active disputes list | Phase 8 |
| 57 | Dispute mediation interface | Phase 8 |
| 58 | Booking lookup | Phase 4 (general admin, available throughout) |
| 59 | Cleaner detail view | Phase 4 |
| 60 | Customer detail view | Phase 4 |

### `wireframes_wf061-070.html` — Specialty surfaces + badges + final

| WF | Title | Phase |
|---|---|---|
| 61 | "On my way" detail page (cleaner-side, full-screen) | Phase 6d |
| 62 | Refund processing screen (admin) | Phase 9 |
| 63 | Stripe Connect onboarding wrapper | Phase 4 |
| 64 | Background-checked badge / trust page | Phase 7 |
| 65 | ZIP-locked badge detail page | Phase 7 |
| 66 | Specialty endorsement page | Phase 7 |
| 67 | Press kit / launch page | Phase 10 |
| 68 | Cleaner: lateness flag / running late | Phase 6d/6e |
| 69 | Customer: rebook same address / new cleaner | Phase 6g |
| 70 | Customer: post-launch waitlist signup | Phase 10 |

---

## Phase reverse lookup

Use this when starting a build phase to know every wireframe relevant to it.

### Phase 1 — Foundation (1–2 weeks)
*No specific wireframes. Project setup only.*

### Phase 2 — Authentication (1–2 weeks)
- WF 35 — Forgot password / account recovery
- WF 36 — Email verification
- WF 37 — Push notification permission

### Phase 3 — Customer onboarding (1 week)
- WF 28 — Customer settings
- WF 29 — Customer privacy settings

### Phase 4 — Cleaner onboarding pipeline (3 weeks)
**Cleaner-side flows:**
- WF 26 — Cleaner profile editor
- WF 27 — Cleaner availability calendar (also used in Phase 6c)
- WF 30 — Cleaner settings
- WF 31 — Cleaner profile settings
- WF 33 — Background check status
- WF 34 — Tax info collection
- WF 49 — Photo etiquette training (gated step)
- WF 63 — Stripe Connect onboarding wrapper

**Admin tooling (pulled into Phase 4 per Master Guide):**
- WF 54 — Admin dashboard / daily metrics
- WF 55 — Cleaner application queue
- WF 58 — Booking lookup
- WF 59 — Cleaner detail view
- WF 60 — Customer detail view

### Phase 5 — Browse, discovery, matching (3–4 weeks)
- WF 1 — Customer homepage
- WF 2 — Cleaner dashboard (tightened) — *built alongside customer-side for shell*
- WF 2b — Cleaner dashboard empty state
- WF 7 — Cleaner profile, customer-facing
- WF 8 — Cleaner list page (heavy filtering query)
- WF 11 — Customer dashboard
- WF 25 — Customer favorites *(lightweight, defer-friendly)*

### Phase 6 — Booking transaction (5–6 weeks)
**6a — Stripe customer payment:**
- WF 28 (re-entry — payment method addition)

**6b — In-app messaging:**
- WF 18 — In-app messaging thread

**6c — Cleaner-side acceptance:**
- WF 3 — Cleaner job inbox
- WF 3b — Empty state
- WF 27 — Cleaner availability calendar (re-entry)

**6d — GPS and "On my way":**
- WF 4 — "On my way" screen
- WF 4b — Arrived state
- WF 61 — "On my way" detail (full-screen during transit)
- WF 68 — Lateness flag / running late

**6e — Active job tracking + photo system:**
- WF 5 — Cleaner active job screen
- WF 5b — Ready to clock out
- WF 9 — Customer active job tracker

**6f — Approve and pay:**
- WF 10 — Approve & pay screen
- WF 20 — Review prompt with optional tip
- WF 23 — Tip prompt (standalone)

**6g — Recurring bookings:**
- WF 21 — Recurring booking setup
- WF 22 — Recurring management
- WF 24 — Auto-rebook nudge
- WF 69 — Customer rebook same address / new cleaner

**Booking modifications (post-MVP add-on inside Phase 6):**
- WF 14 — Reschedule flow
- WF 15 — Cancel flow with penalty disclosure

### Phase 7 — Trust systems (3–4 weeks)
- WF 2c — Score breakdown deep-dive
- WF 2d — Dashboard probation state
- WF 32 — Insurance Verified upload flow
- WF 51 — Tier system explainer
- WF 52 — Reliability score explainer
- WF 53 — Score change notification states (4)
- WF 64 — Background-checked badge / trust page
- WF 65 — ZIP-locked badge detail page
- WF 66 — Specialty endorsement page

### Phase 8 — Disputes (3 weeks)
- WF 16 — Dispute filing (customer)
- WF 17 — Dispute response (cleaner)
- WF 56 — Active disputes list (admin)
- WF 57 — Dispute mediation interface (admin)

### Phase 9 — Money operations (2–3 weeks)
- WF 6 — Cleaner earnings & payouts
- WF 6b — Earnings empty state
- WF 62 — Refund processing screen (admin)

### Phase 10 — Polish & marketing (3–4 weeks)
**Polish:**
- WF 19 — Notification center
- WF 38 — Empty states (multiple contexts)
- WF 39 — Error states (multiple contexts)
- WF 40a/b/c — Loading states
- WF 47 — Contact / Support
- WF 48 — Customer first-time tour
- WF 50 — Cleaner platform tour

**Marketing:**
- WF 41 — City × Service SEO landing *(deferrable post-launch)*
- WF 42 — Pricing page
- WF 43 — About page
- WF 44 — Help center index
- WF 45 — FAQ page
- WF 46 — Coverage page
- WF 67 — Press kit / launch page
- WF 70 — Post-launch waitlist signup

---

## Phase mapping notes

A few WFs have phase assignments that need explanation:

- **WF 14, 15** (reschedule, cancel) are placed inside Phase 6 because they're booking modifications, but the Master Guide doesn't explicitly assign them. Realistically these can ship after the core booking loop works (call them Phase 6h).
- **WF 25** (favorites) is in Phase 5 but is genuinely lightweight; if Phase 5 runs long, defer to Phase 10.
- **WF 27** (availability calendar) appears in both Phase 4 (cleaner-side onboarding sets initial availability) and Phase 6c (cleaner manages availability when accepting jobs). Build the read/edit UI in Phase 4, the booking-time read in Phase 6c.
- **WF 38, 39** (empty + error states) should not be a Phase 10 dump. Build the *patterns* there, but inject specific empty/error states throughout earlier phases as their host screens are built.
- **WF 58, 59, 60** (admin booking/cleaner/customer detail) can be lightweight in Phase 4 (read-only views to support admin review) and expanded later as needed.

---

## Format conventions inside the wireframe HTML files

If you need to scan or modify the wireframe HTML directly, the section markers vary by file:

- **`wf001-007`, `wf008-011`, `wf014-020`, `wf021-027`, `wf028-032`** use:
  ```
  <!-- ============================================================
       WIREFRAME N - SCREEN TITLE
       ============================================================ -->
  ```

- **`wf033-039`, `wf040-046`, `wf047-053`, `wf054-060`, `wf061-070`** use:
  ```
  <!-- WN: Screen title -->
  ```

This is a build-history artifact, not a problem. If you ever consolidate, normalize to whichever convention you prefer.

---

## Maintenance

When adding a new wireframe:
1. Add the screen to the appropriate file (or create a new file if the WF range warrants it)
2. Update the **Quick reference table** if file scope changes
3. Add the row to the **Per-file detailed listing**
4. Add the WF to the **Phase reverse lookup** under its phase

When deferring a wireframe (like WF 12, 13):
1. Mark it explicitly in the Quick reference table as deferred
2. Don't leave a gap that future-you will wonder about

---

*Last updated: assembled from canonical wireframe files post-rename.*
