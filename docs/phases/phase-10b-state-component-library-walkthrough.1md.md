# Phase 10b — Plain-English Breakdown

This document walks through `phase-10b-state-component-library-spec.md` in plain English.

Phase 10b is **the consistency layer.** Before Phase 10b, every screen has its own ad-hoc empty/error/loading state. After Phase 10b, all states route through reusable components. The result: predictable UX patterns. Users learn one — they know all.

This is also the phase that catches every hardcoded "no data yet" message and replaces with proper component. Big consolidation pass.

---

# Section 0 — External account prerequisites

## What it means in plain English

No new vendors. Internal component work.

Decision points:
- Animation library (recommendation: pure CSS, defer Framer Motion)
- Icon library (Lucide already in use)
- Illustrations vs icons (MVP icons; post-launch illustrations)

## Beginner traps

- **Don't add Framer Motion just because it's nice.** Bundle size matters.
- **Don't block Phase 10b on custom illustrations.** Icons work for MVP.

---

# Section 1 — Summary

## What it means in plain English

Nine things will work after Phase 10b:

1. `<EmptyState>` component
2. ~10 empty state contexts
3. `<ErrorState>` with 3 severities
4. ~14 error state contexts
5. `<Skeleton>` + variants
6. 3 skeleton variants (list, card, page)
7. Photo upload progress
8. Existing hardcoded states refactored
9. Storybook documentation

## Why "thin wrapper" pattern

Core `<EmptyState>` component has props (icon, headline, etc.). Each context (CustomerNoBookings, NoFavorites) is a small file that calls `<EmptyState>` with specific props.

Why this pattern:
- One source of truth for empty state look/feel
- Per-context customization without forking core
- Easy A/B tests (replace single context)

### Why ~14 error contexts

Many error scenarios:
- Validation (warning severity)
- Recoverable (error severity, retry action)
- Blocking (blocking severity, requires intervention)

Each common scenario gets a dedicated wrapper.

## Beginner traps

- **Don't reinvent state UX per screen.** Component library exists for consistency.
- **Don't conflate empty + error.** Different states; different UX.

---

# Section 2 — Acceptance criteria

## What it means in plain English

Three groups: empty, error, loading.

### Empty states

10 contexts. Each WF 38 + implied. The "no cleaners in ZIP" includes waitlist CTA — Phase 10d connects.

Critical: skeleton renders during load; empty state ONLY when data confirmed empty.

### Error states

14 contexts. 3 severity levels:
- Warning: validation, soft errors
- Error: recoverable, retry
- Blocking: requires intervention (auth expired, account suspended)

Visual distinction (color + icon + layout) per severity.

### Loading + skeleton

Skeleton = placeholder shape during data fetch. List, card, page variants.

Photo upload progress is special — Phase 6e cleaner uploads many photos at once. Progress + remaining count visible.

### Cross-cutting

ARIA labels matter. Screen readers announce "Loading..." or "Empty: no bookings yet." Without ARIA, accessibility fails.

## Beginner traps

- **Don't skip ARIA.** Accessibility audit catches.
- **Don't flash empty state during load.** UX jumpy.

---

# Section 3 — Database state required

## What it means in plain English

No new tables. Pure UI.

## Beginner traps

- **Don't try to add tables for empty state config.** Use TypeScript constants.

---

# Section 4 — Files to create

## What it means in plain English

~36 files:
- 12 core components
- 10 empty wrappers
- 14 error wrappers
- Plus Storybook
- Plus refactor PRs

### Why so many wrappers

Each context has:
- Specific copy
- Specific icon
- Specific actions
- Specific empty/error rationale

Wrappers encode this; core component stays clean.

## Beginner traps

- **Don't put all empty contexts in one file.** Doesn't scale.
- **Don't skip Storybook.** Designer reference.

---

# Section 5 — Implementation order

## What it means in plain English

5 days:
- Days 1-2: empty
- Days 3-4: error
- Day 5: loading + closeout

## Why empty before error

Empty states are simpler (single severity). Build first to establish patterns. Apply patterns to error states.

## Beginner traps

- **Don't try to build all states in parallel.** Sequential focus.

---

# Section 6 — Specific gotchas

## What it means in plain English

8 gotchas:

### A — Skeleton vs empty confusion
Brief skeleton flash. **Fix:** smooth transition; animate.

### B — Error boundary catches expected errors
Validation bubbles up. **Fix:** boundary for unhandled only.

### C — Empty action ambiguous
"Browse cleaners" on browse page. **Fix:** context-aware actions.

### D — Retry loops
Same error returns. **Fix:** attempt counter + escalate.

### E — Skeleton dimension mismatch
Layout shift. **Fix:** match real content exactly.

### F — Storybook drift
Outdated entries. **Fix:** PR lint check.

### G — Empty during error
0 results from error. **Fix:** tri-state pattern (loading/error/success).

### H — Upload progress stuck at 99%
Final commit takes time. **Fix:** "Finalizing..." state.

## Why these matter

Polish lives in the gotchas. Phase 10b without these = janky UX.

## Beginner traps

- **Don't trust default error boundary behavior.** Unexpected catches happen.
- **Don't trust skeleton library defaults.** Audit dimensions.

---

# Section 7 — Testing strategy

Standard layers + visual regression. Storybook screenshots + diff on PR.

## Beginner traps

- **Don't skip visual regression.** UI changes drift silently.

---

# Section 8 — Deployment plan

Standard. **7-day soft launch** (UI-only, lower risk).

---

# Section 9 — Handoff to Phase 10c/10d

State components feed marketing pages, tours, support forms.

---

# Section 10 — Open questions

1. Custom illustrations (defer)
2. Copy in JSON file (recommend yes)
3. Animation library (CSS sufficient)

---

# Notes on what comes next

Phase 10c (marketing pages + SEO) — uses state components.
Phase 10d (tours + support + polish) — uses state components.

Phase 10b is the consistency baseline. Get this right; Phase 10c/d build on it.

---

This walkthrough is the Phase 10b learning document.
