# Phase 4 — Cleaner Onboarding Pipeline Spec

> **Goal:** A cleaner can apply, complete the multi-step form, and be approved by an admin.
> **Estimated time:** 3 weeks.
> **Prerequisite:** Phase 3 complete (users.id = auth.uid(), RLS working).

---

## Acceptance criteria — Phase 4 is "done" when:

- [ ] Authenticated user can start a cleaner application (draft created)
- [ ] Multi-step application form saves each step's data to `application_data` JSONB
- [ ] Photo etiquette training shown and must be acknowledged before proceeding
- [ ] Application can be submitted (state: draft → submitted)
- [ ] Applicant sees a status page after submission
- [ ] Admin can list all submitted applications
- [ ] Admin can view full application detail
- [ ] Admin can approve, reject, or request more info
- [ ] Approval creates `cleaner_profiles` row and links it to the application
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass
- [ ] Production deploy succeeds

---

## Scope (this phase only)

In scope:
- Multi-step cleaner application form (5 steps)
- Photo etiquette training screen (step 4)
- Application submission flow
- Applicant status page
- Admin application list + detail + decision actions
- Service role admin client

Out of scope (deferred until API keys are available):
- Stripe Identity session creation
- Checkr background check integration
- Stripe Connect account + onboarding link

These are shown as placeholder cards on the status page.

---

## Application flow

```
/app/apply              → entry: no app → show start page; existing app → redirect
/app/apply/step/1       → Service coverage (zip, travel radius)
/app/apply/step/2       → Experience + service types
/app/apply/step/3       → About you (why PureTask)
/app/apply/step/4       → Photo etiquette training + acknowledgment
/app/apply/step/5       → Review + submit
/app/apply/status       → Post-submit status page
/app/admin/applications → Admin list (submitted / in_review / needs_info)
/app/admin/applications/[id] → Admin detail + decision
```

---

## Implementation tasks

### Task 1 — Service role admin client

Create `src/lib/supabase/admin.ts` — service role client for admin operations that need to bypass RLS (e.g. inserting cleaner_profiles on approval).

### Task 2 — Cleaner feature module

`src/features/cleaner/`:
- `queries.ts` — getMyApplication, getApplicationById, listApplications
- `validation.ts` — step1–4 Zod schemas
- `actions.ts` — createDraftAction, saveStepAction, submitApplicationAction, adminDecisionAction

### Task 3 — Step components

`src/features/cleaner/components/`:
- `StepIndicator.tsx` — progress bar (shared across steps)
- `ApplicationStep1.tsx` — zip + radius
- `ApplicationStep2.tsx` — experience + service types
- `ApplicationStep3.tsx` — why PureTask textarea
- `ApplicationStep4.tsx` — photo etiquette + acknowledgment
- `ApplicationReview.tsx` — read-only summary + submit
- `ApplicationStatus.tsx` — post-submit status display

### Task 4 — Admin components

- `AdminApplicationList.tsx` — list of applications with state badges
- `AdminDecisionForm.tsx` — approve / reject / request info form

### Task 5 — Routes

- `src/app/(app)/app/apply/page.tsx`
- `src/app/(app)/app/apply/step/[step]/page.tsx`
- `src/app/(app)/app/apply/status/page.tsx`
- `src/app/(app)/app/admin/applications/page.tsx`
- `src/app/(app)/app/admin/applications/[id]/page.tsx`

### Task 6 — Quality checks + deploy

- `pnpm lint` / `pnpm typecheck` / `pnpm build`

---

## DB tables used

| Table | Operations | RLS |
|---|---|---|
| `cleaner_applications` | SELECT, INSERT, UPDATE | `user_id = auth.uid()` for draft/needs_info; admin full access |
| `cleaner_profiles` | INSERT (approval only) | Service role (no INSERT RLS for anon client) |

## application_data JSONB shape (draft state)

```json
{
  "home_zip": "95814",
  "travel_radius_miles": 20,
  "years_experience": 5,
  "service_types": ["standard", "deep"],
  "why_puretask_text": "...",
  "etiquette_acknowledged": true
}
```

## Definition of done

Phase 4 is complete only when all acceptance criteria above are checked.
