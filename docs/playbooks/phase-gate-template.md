# Phase Gate Template

Purpose: prevent "phase drift" and block phase completion until all required implementation and verification items are proven.

Use this template at the end of every phase before merge.

---

## 1) Phase Info
- Phase name/number:
- Date:
- Owner:
- Branch / PR:
- Source spec(s):
  - `docs/phases/`

## 2) Scope Lock
- In-scope items from spec:
  - [ ] Item 1
  - [ ] Item 2
  - [ ] Item 3
- Out-of-scope items confirmed not included:
  - [ ] Out-of-scope list reviewed and respected

## 3) Acceptance Criteria Gate (Spec-Literal)
- Copy every acceptance criterion from the phase spec and mark pass/fail with evidence.

- [ ] AC-01:
  - Status: pass/fail
  - Evidence:
- [ ] AC-02:
  - Status: pass/fail
  - Evidence:
- [ ] AC-03:
  - Status: pass/fail
  - Evidence:

Rule: if any AC is fail/unknown, phase cannot be marked complete.

## 4) File/Path Contract Gate
- Required files exist at exact spec paths.
- Required legacy redirects/aliases handled.

- [ ] Route files match spec paths exactly
- [ ] Feature module files match spec paths exactly
- [ ] Migration filenames match spec naming/order
- [ ] No accidental alternate-path implementation

Evidence (commands/output):
- `git status --short`
- `git diff --name-only`
- `rg "<route or symbol>" src`

## 5) Data and Security Gate
- [ ] Migrations applied in target environment(s)
- [ ] RLS enabled on required tables
- [ ] Required policies exist and enforce owner isolation
- [ ] No direct cross-user reads/writes possible
- [ ] Soft-delete behavior verified where required

Evidence:
- SQL snippets used:
- SQL results:

## 6) Runtime Quality Gate
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes (for phase closeout)
- [ ] No new linter/type errors introduced

Evidence:
- Command outputs captured:

## 7) UX and Functional Gate
- [ ] Happy path works end-to-end
- [ ] Validation errors render correctly
- [ ] Auth gating/redirect behavior correct
- [ ] Mobile width >=360px has no horizontal scroll
- [ ] Empty/loading/error states acceptable

Evidence:
- Screenshots/recordings:
- Notes:

## 8) Production Verification Gate
- [ ] Latest commit deployed to production
- [ ] Production URL accessible
- [ ] Phase-critical flows verified on production (not just local)
- [ ] At least one real test user completed required flow

Evidence:
- Production URL:
- Deploy ID / commit SHA:
- Flow checklist results:

## 9) Documentation Sync Gate
- [ ] Phase progress report updated (`docs/phases/phase-N-progress-update.md`)
- [ ] Final report updated if phase complete
- [ ] Any decision changes reflected in `docs/puretask-decisions.md`
- [ ] Playbooks updated if conventions changed

## 10) Closeout Decision
- Gate result: `PASS` / `FAIL`
- Blocking issues (if fail):
  - [ ] Issue 1
  - [ ] Issue 2
- Follow-ups (non-blocking):
  - [ ] Follow-up 1
  - [ ] Follow-up 2

Completion rule:
- Phase is complete only when all gates above are checked pass with evidence.
