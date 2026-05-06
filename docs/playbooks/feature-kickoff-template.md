# Feature Kickoff Template

Use this at the start of every new feature, refactor, or bug fix.

Copy this into a new file under `docs/phases/` or your working notes and fill it out before coding.

---

## 1) Task Snapshot
- Feature/task name:
- Phase:
- Owner:
- Date:
- Linked spec/docs:

## 2) Scope and Outcome
- Problem being solved:
- In scope:
- Out of scope:
- Definition of done:

## 3) Playbooks to Apply
- [ ] `docs/puretask-build-playbook.md`
- [ ] `docs/playbooks/category-02-folder-file-structure.md`
- [ ] `docs/playbooks/category-03-naming-conventions.md`
- [ ] `docs/playbooks/category-06-server-client-boundaries.md`
- [ ] Add other relevant categories:
  - [ ] `docs/playbooks/category-__-________________.md`
  - [ ] `docs/playbooks/category-__-________________.md`

## 4) File Plan (before edits)
- New files to create:
  - ``
- Existing files to edit:
  - ``
- Files explicitly not touched:
  - ``

## 5) Data and Schema Impact
- DB migration needed? (yes/no):
- If yes, migration file:
  - `db/migrations/`
- RLS policy changes needed?:
- Supabase types regeneration needed?:

## 6) Server/Client Boundary Plan
- Server Components used for:
- Client Components required for:
- Server actions planned:
- Route handlers (webhooks/callbacks) planned:

## 7) Validation and Error Plan
- Zod schemas to add/update:
- Form(s) using react-hook-form:
- Error mapping path (`format-error`) impact:
- Expected server action return shape confirmed:
  - `{ ok: true, data } | { ok: false, error }`

## 8) Environment and Security Check
- New env vars required?:
- `.env.example` update required?:
- Any secret exposure risk?:
- PII logging risk reviewed?:

## 9) Verification Plan
- Manual checks:
  - [ ] Happy path
  - [ ] Validation errors
  - [ ] Auth-protected behavior
  - [ ] Edge case(s)
- Commands:
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck`

## 10) PR Checklist Preview
- [ ] Follows naming and structure rules
- [ ] Pages remain thin
- [ ] Correct Supabase client by runtime
- [ ] No unintended `'use client'`
- [ ] No secrets committed
- [ ] Risks/follow-ups documented

---

## Post-Implementation Notes
- What changed:
- Deviations from plan:
- Follow-up tasks:
