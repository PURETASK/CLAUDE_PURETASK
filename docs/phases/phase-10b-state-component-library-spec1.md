# Phase 10b — State Component Library Specification

> **Author note (transparency):** This spec is being written ahead of when Phase 10b will actually be built. The spec is correct as of the current date but will need a refresh when implementation actually starts, particularly for: actual hardcoded states encountered across phases (will likely surface more than ~20 contexts), animation library choice (Framer Motion vs CSS-only), and skeleton library decisions. Treat this as an aggressive draft.

**Phase goal:** Reusable empty, error, and loading state components used across all phases. WF 38 patterns implemented (~10 empty contexts). WF 39 patterns implemented (~14 error contexts). WF 40 patterns implemented (3 loading sub-states). Phase 5/6/7 screens that previously rendered hardcoded states adopt the component library. Consistent UX everywhere data could be empty, errored, or loading.

**Estimated duration:** ~1 week of focused engineering (5 working days).

**Depends on:**
- Phase 5/6/7 routes built (have existing hardcoded states to refactor)
- Phase 10a operational (skeleton states match notification patterns)
- shadcn/ui and Tailwind component standards
- Brand assets finalized (icons, illustrations)

**Wireframes covered:** WF 38 (empty states — 3 explicit contexts + ~7 implied), WF 39 (error states — 4 explicit + ~10 implied), WF 40 (loading — 3 sub-states).

**Phase 10b sub-sections (parallel within 10b):**

- **10b-1** — Empty state component library (~2 days)
- **10b-2** — Error state component library (~2 days)
- **10b-3** — Loading state + skeleton library (~1 day)

---

## 0. External account prerequisites

Phase 10b has **no new vendors.** Internal component library work.

### 0.1 Animation library decision

Tailwind handles most animations natively. Phase 10b animation needs:
- Skeleton shimmer (CSS gradient animation; no library needed)
- Empty state subtle entrance (CSS or Framer Motion)
- Error state shake on validation fail (CSS keyframes)

Recommendation: pure CSS for performance. Add Framer Motion only if significant motion design emerges in Phase 10d.

### 0.2 Icon library

Lucide React already in use (Phase 1). Phase 10b uses Lucide icons for state components. No new icon library.

### 0.3 Illustration assets (optional)

Empty states can be text-only or include illustration. Recommendation:
- MVP: text + Lucide icons only (consistent, fast)
- Post-launch: custom illustrations as polish layer

Document the deferred decision.

---

## 1. Summary

Phase 10b is **the consistency layer.** Concretely, by the end of Phase 10b:

1. **`<EmptyState>` component** renders consistent empty UI across platform.

2. **~10 empty state contexts implemented** via composition: customer no bookings, cleaner no requests, no cleaners in ZIP, no favorites, no notifications, no reviews yet, no service area, no earnings, no recurring bookings, no messages.

3. **`<ErrorState>` component** renders consistent error UI. 3 severity levels (warning/error/blocking).

4. **~14 error state contexts implemented**: payment declined, booking conflict, network error, 404, cleaner application rejected, background check consider, insurance upload rejected, booking creation hard fail, photo upload failed, Stripe Connect unverified, auth session expired, booking past auto-approval, dispute submission failed, unexpected error fallback.

5. **`<Skeleton>` + `<LoadingState>` components** for loading.

6. **3 skeleton variants**: list skeleton, card skeleton, full-page skeleton.

7. **Photo upload progress component** (WF 40 sub-state) for Phase 6e + onboarding.

8. **Existing hardcoded states refactored** to use library.

9. **Storybook documentation** for all states (developer reference).

What Phase 10b does NOT do:
- Tour overlays (Phase 10d)
- Marketing page components (Phase 10c)
- Animation polish beyond states (Phase 10d)

---

## 2. Acceptance criteria

### 10b-1 Empty state library

- [ ] `<EmptyState>` component exists in `/components/ui/state/`
- [ ] API: `icon`, `headline`, `subtext`, `primaryAction`, `secondaryAction` (optional)
- [ ] Tailwind-styled, brand-consistent
- [ ] Storybook entry with all variants
- [ ] WF 38.1: Customer no bookings empty state implemented
- [ ] WF 38.2: Cleaner no incoming jobs empty state implemented
- [ ] WF 38.3: Customer no cleaners in ZIP empty state (with waitlist CTA)
- [ ] WF 25.5: No favorites empty state
- [ ] WF 19: No notifications empty state
- [ ] WF 7: No reviews yet empty state
- [ ] WF 27: No service area set empty state
- [ ] WF 6b: No earnings yet empty state
- [ ] No recurring bookings empty state
- [ ] No messages empty state
- [ ] All existing hardcoded empty markup replaced
- [ ] **Critical:** skeleton renders during load; empty state only on data confirmed empty

### 10b-2 Error state library

- [ ] `<ErrorState>` component in `/components/ui/state/`
- [ ] API: `severity` (warning/error/blocking), `headline`, `detail`, `primaryAction`, `secondaryAction` (optional)
- [ ] 3 severity visual distinctions (color, icon, layout)
- [ ] Storybook entry with all variants
- [ ] WF 39.1: Payment declined (with booking hold timer)
- [ ] WF 39.2: Booking conflict (race lost)
- [ ] WF 39.3: Network error (retry button)
- [ ] WF 39.4: 404 page not found
- [ ] Cleaner application rejected
- [ ] Background check consider state
- [ ] Insurance upload rejected
- [ ] Booking creation hard fail
- [ ] Photo upload failed
- [ ] Stripe Connect unverified
- [ ] Auth session expired
- [ ] Booking past auto-approval (Phase 6f)
- [ ] Dispute submission failed
- [ ] Unexpected error fallback (catches uncaught exceptions)

### 10b-3 Loading + skeleton library

- [ ] `<Skeleton>` component with shimmer animation
- [ ] `<SkeletonList>` (renders N skeleton rows)
- [ ] `<SkeletonCard>` (cleaner card / booking card placeholder)
- [ ] `<SkeletonPage>` (full-page skeleton for route transitions)
- [ ] `<LoadingSpinner>` for inline loading
- [ ] `<PhotoUploadProgress>` for Phase 6e (% complete + remaining count)
- [ ] All routes use skeletons during data fetch
- [ ] No "blank screen" between navigation and content load

### Cross-cutting

- [ ] All Phase 10b components have unit tests
- [ ] Storybook documentation complete
- [ ] Accessibility: ARIA labels, focus management on actions
- [ ] Performance: components render <50ms

---

## 3. Database state required

### Existing tables

No new tables. Phase 10b is pure UI components.

### Migrations

No migrations required for Phase 10b.

---

## 4. Files to create

### Component library (~12 files)

- `/components/ui/state/EmptyState.tsx`
- `/components/ui/state/ErrorState.tsx`
- `/components/ui/state/Skeleton.tsx`
- `/components/ui/state/SkeletonList.tsx`
- `/components/ui/state/SkeletonCard.tsx`
- `/components/ui/state/SkeletonPage.tsx`
- `/components/ui/state/LoadingSpinner.tsx`
- `/components/ui/state/PhotoUploadProgress.tsx`
- `/components/ui/state/UnexpectedErrorBoundary.tsx`
- `/components/ui/state/index.ts` — exports
- `/components/ui/state/types.ts` — shared types
- `/components/ui/state/empty-state-presets.ts` — pre-composed common contexts

### Empty state contexts (~10 thin wrappers)

- `/components/empty-states/CustomerNoBookings.tsx` (WF 38.1)
- `/components/empty-states/CleanerNoIncomingJobs.tsx` (WF 38.2)
- `/components/empty-states/NoCleanersInZip.tsx` (WF 38.3)
- `/components/empty-states/NoFavorites.tsx` (WF 25.5)
- `/components/empty-states/NoNotifications.tsx` (WF 19)
- `/components/empty-states/NoReviewsYet.tsx` (WF 7)
- `/components/empty-states/NoServiceArea.tsx` (WF 27)
- `/components/empty-states/NoEarningsYet.tsx` (WF 6b)
- `/components/empty-states/NoRecurringBookings.tsx`
- `/components/empty-states/NoMessages.tsx`

### Error state contexts (~14 thin wrappers)

- `/components/error-states/PaymentDeclined.tsx` (WF 39.1)
- `/components/error-states/BookingConflict.tsx` (WF 39.2)
- `/components/error-states/NetworkError.tsx` (WF 39.3)
- `/components/error-states/NotFound404.tsx` (WF 39.4)
- `/components/error-states/CleanerApplicationRejected.tsx`
- `/components/error-states/BackgroundCheckConsider.tsx`
- `/components/error-states/InsuranceUploadRejected.tsx`
- `/components/error-states/BookingCreationFailed.tsx`
- `/components/error-states/PhotoUploadFailed.tsx`
- `/components/error-states/StripeConnectUnverified.tsx`
- `/components/error-states/AuthSessionExpired.tsx`
- `/components/error-states/BookingPastApproval.tsx`
- `/components/error-states/DisputeSubmissionFailed.tsx`
- `/components/error-states/UnexpectedError.tsx` — global fallback

### Storybook (1 file per component)

- `*.stories.tsx` for each component
- Variant grid for visual regression review

### Refactor existing hardcoded states

Phases 5, 6, 7 have inline empty/error markup. Phase 10b refactors:
- Phase 5 browse: no cleaners in ZIP
- Phase 6: payment declined, booking conflict
- Phase 7: tier display while data loads

Track via grep audit; replace incrementally.

### Docs (3 files)

- (Phase 10 overview already exists)
- `phase-10b-state-component-library-spec.md` — this file
- `phase-10b-state-component-library-walkthrough.md`

---

## 5. Implementation order

### 10b-1 — Empty states (~2 days)

**Day 1 — Core `<EmptyState>` + 5 contexts.** Build component, props, styles, Storybook. Implement WF 38.1, 38.2, 38.3, 19, 25.5.

**Day 2 — Remaining 5 contexts + refactor.** Implement remaining empty states. Refactor existing hardcoded markup.

### 10b-2 — Error states (~2 days)

**Day 3 — Core `<ErrorState>` + 7 contexts.** Build component with 3 severity levels. Implement WF 39.1-4, common error states.

**Day 4 — Remaining 7 contexts + global fallback.** Implement remaining error contexts. `UnexpectedErrorBoundary` for global fallback.

### 10b-3 — Loading + skeleton (~1 day)

**Day 5 — Skeletons + photo upload progress + closeout.** Build skeleton variants. `<PhotoUploadProgress>`. End-to-end audit: every route has loading + empty + error states.

---

## 6. Specific gotchas

### Gotcha A — Skeleton vs empty state confusion

**The problem:** User opens page. Brief skeleton flash. Then empty state for 0 results. UX feels jumpy.

**The fix:** Skeleton shows ONLY during data fetch. After fetch resolves with 0 results → empty state replaces skeleton smoothly. Animate transition (fade) for polish.

### Gotcha B — Error boundary catches expected errors

**The problem:** Validation error in form (expected) bubbles to `UnexpectedErrorBoundary`. Shows generic error instead of inline validation.

**The fix:** Error boundary only catches unhandled exceptions. Form validation errors handled inline with `<ErrorState severity="warning">`. Document distinction.

### Gotcha C — Empty state primary action ambiguous

**The problem:** "No favorites" empty state with "Browse cleaners" primary action. But user is already on browse page. Action loops.

**The fix:** Context-aware actions. Empty state on browse page = "Try a different ZIP" instead of "Browse cleaners." Per-context action design.

### Gotcha D — Error state action triggers same error

**The problem:** Network error has "Retry" action. User clicks; same network error returns. Repeats infinitely.

**The fix:** Retry tracks attempts. After 3 retries, action becomes "Contact support" instead. Document loop prevention.

### Gotcha E — Skeleton dimensions don't match real content

**The problem:** Skeleton card is 200px tall. Real cleaner card is 280px tall. Layout shifts when data loads.

**The fix:** Skeleton dimensions exactly match real content. Audit each skeleton vs final UI; adjust.

### Gotcha F — Storybook variants drift from production

**The problem:** Storybook entry shows old component design. Production uses updated. Designer reviews Storybook; misses changes.

**The fix:** Storybook updated as part of component change PR. Lint check fails if component changes without Storybook update.

### Gotcha G — Empty state during error confused

**The problem:** API returns error. Code interprets as "0 results." Empty state shown instead of error state.

**The fix:** Distinct loading/error/success states from data layer. Only success + 0 results = empty. Error = error state. Loading = skeleton. Document tri-state pattern.

### Gotcha H — Photo upload progress stuck at 99%

**The problem:** Last photo uploads at 99%; final commit takes 5 seconds. User thinks frozen.

**The fix:** Show "Finalizing..." after 99% reached. Real progress vs final commit clearly distinguished.

---

## 7. Testing strategy

### Unit tests
- Each component renders correctly with all props
- Severity levels render distinct visuals
- Action handlers fire correctly
- Skeleton dimensions match documented values

### Visual regression tests
- Storybook variants captured as screenshots
- Diff on PR; manual review

### Integration tests
- Refactored Phase 5/6/7 routes still work
- Empty/error/loading transitions smooth

### Manual QA
- Every empty state context exercised
- Every error state context exercised
- Skeleton on every route during data fetch
- Photo upload progress real-world test

---

## 8. Deployment plan

### Pre-deploy
- [ ] Storybook complete
- [ ] All hardcoded states refactored
- [ ] Visual regression baseline captured

### Deployment order
1. Component library
2. Empty + error contexts
3. Refactor existing routes (incremental PRs)
4. Storybook deployed for design review
5. Soft launch: 7 days monitoring (UI-only changes lower risk)

### Rollback
- Component library is purely additive
- Refactored routes can revert if regression

---

## 9. Phase 10b → Phase 10c/10d handoff

Phase 10b output for Phase 10c/d:
- State components used in marketing pages
- Tours can leverage skeleton patterns
- Support ticketing forms use error states

---

## 10. Open questions

1. **Custom illustrations vs icons.** MVP icons; post-launch illustrations. Document.
2. **Empty state copy authoritative source.** Maintain in `/content/empty-states.json` for easy editing without code changes? Recommend yes.
3. **Animation library.** CSS-only sufficient for Phase 10b. Re-evaluate if Phase 10d needs Framer Motion.

---

This spec is the canonical Phase 10b build reference. Walkthrough lives in `phase-10b-state-component-library-walkthrough.md`.
