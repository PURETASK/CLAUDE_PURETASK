# Phase 9 — Customer Reviews Spec

> **Goal:** Customers can rate and review the cleaner after work is approved. Reviews appear on the cleaner's public profile and feed the Match Score and `average_rating`.
> **Status:** Scaffolded. Trait chips and admin moderation deferred.
> **Prerequisite:** Phase 8 (verification flow that produces `approved`/`auto_approved` bookings).

---

## Acceptance criteria

- [ ] Customer on an `approved` / `auto_approved` / `paid` / `dispute_resolved` booking can submit a 1-5 star review with optional body text
- [ ] One review per booking (DB-enforced via `UNIQUE (booking_id)`)
- [ ] Review content (stars, body) is immutable after submission (DB trigger)
- [ ] Cleaner profile page lists their public reviews newest-first
- [ ] Customer sees their already-submitted review on the booking detail page
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` all pass

---

## Files (current scaffold)

### New

| File                                             | Description                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `src/features/reviews/validation.ts`             | Zod `submitReviewSchema` (1-5 stars, ≤2000-char body)                                      |
| `src/features/reviews/queries.ts`                | `getReviewsForCleaner` (public+non-hidden, paginated), `getReviewForBooking`               |
| `src/features/reviews/actions.ts`                | `submitReviewAction` (validates booking ownership + reviewable state + no existing review) |
| `src/features/reviews/components/ReviewForm.tsx` | Star-picker client form using `useActionState`                                             |
| `src/features/reviews/components/ReviewList.tsx` | Server component rendering reviews on cleaner profile                                      |

### Modified

| File                                       | Change                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/app/(app)/app/cleaners/[id]/page.tsx` | Adds `<ReviewList>` section                                                          |
| `src/app/(app)/app/bookings/[id]/page.tsx` | Adds `<ReviewForm>` on reviewable bookings + your-review summary on already-reviewed |

---

## DB notes

- `reviews` table from `0003_b3_trust_evidence.sql` is used as-is
- Trigger `reviews_immutable_content` blocks edits to stars/body/FK fields
- `UNIQUE (booking_id)` prevents duplicate reviews
- Indexes already cover `cleaner_id + submitted_at` (newest-first list) and `cleaner_id + stars` (rating aggregations)

## Out of scope (defer)

- Review trait chips (`review_traits` table) — drives specialty endorsements; needs trait picker UI
- Admin moderation (`hidden_at` toggle) — admin dashboard scope
- Cleaner replies to reviews — schema doesn't have a reply field; design decision needed
- Aggregate `cleaner_profiles.average_rating` recalculation — needs DB trigger or background job (current B1 design assumes a trigger; verify or add)
- Email/push notification to cleaner on new review
