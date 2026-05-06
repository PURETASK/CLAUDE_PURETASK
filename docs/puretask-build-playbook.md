# PureTask Build Playbook

Purpose: turn `docs/puretask-decisions.md` into concrete day-to-day build rules.

How to use:
- Read this before starting any new feature.
- Use the checklists during implementation and before opening a PR.
- If a rule here conflicts with `AGENTS.md` or `puretask-decisions.md`, the source docs win and this file should be updated.

## 1) Non-Negotiable Rules

### Stack and runtime
- MUST use Next.js App Router + TypeScript strict mode.
- MUST use Node 20 LTS or 22 LTS.
- MUST use `pnpm` only in this repo.
- NEVER mix package managers (`npm`, `yarn`) with `pnpm`.

### Project structure
- MUST keep pages thin in `src/app/`.
- MUST place business logic in `src/features/<feature>/`.
- MUST keep shared reusable UI in `src/components/shared/`.
- MUST keep shadcn primitives in `src/components/ui/` untouched unless intentionally updating shadcn.
- MUST keep DB migrations in `db/migrations/`.

### Naming conventions
- MUST use PascalCase for React component files and symbols.
- MUST use kebab-case for non-component files and all folders.
- MUST name hooks with `use` prefix.
- MUST name server actions as verb-first with `Action` suffix.
- MUST use snake_case for DB columns.
- MUST use SCREAMING_SNAKE_CASE for true constants.
- MUST use named exports except Next.js required default-export files.

### Server/client boundaries
- MUST default to Server Components.
- MUST add `'use client'` only for interactivity, browser APIs, or state/effects.
- MUST use server actions for app mutations from your own UI.
- MUST use route handlers only for webhooks/third-party callbacks.

### Data and Supabase
- MUST treat `db/migrations/*.sql` as schema source of truth.
- MUST keep RLS enabled for all user-data tables.
- MUST regenerate DB types after schema changes.
- MUST use the correct Supabase client by runtime:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/browser.ts`
  - `src/lib/supabase/middleware.ts`
- NEVER edit shipping schema in Supabase Studio.

### Validation, errors, and security
- MUST use `react-hook-form` + `zod` for forms.
- MUST share validation schemas between form and server action.
- MUST return server action results as `{ ok: true, data } | { ok: false, error }`.
- MUST map user-facing errors through a formatter helper.
- MUST keep secrets out of `NEXT_PUBLIC_*`.
- MUST validate env vars at startup via `src/lib/env.ts`.
- NEVER log PII or secrets.

### Money and time
- MUST store money as integer cents.
- MUST store DB timestamps as UTC `timestamptz`.
- MUST display times in user/local product timezone rules.
- NEVER use floats for money calculations.

### Git and deploy flow
- MUST use feature branches and PRs before `main`.
- MUST keep `main` deployable.
- SHOULD use conventional commit prefixes (`feat`, `fix`, `chore`, `docs`, `refactor`).
- MUST run lint and typecheck before merge.

## 2) Build Checklist (Start of Task)

- Confirm feature scope and phase spec section.
- Identify target feature folder in `src/features/<feature>/`.
- Decide server vs client boundaries before coding.
- Define or update `zod` schema first for any form/mutation.
- Verify any DB change needs migration + RLS + type regen.
- Verify naming and file placement conventions before creating files.

## 3) Build Checklist (During Implementation)

- Keep route file minimal; import feature logic.
- Keep imports ordered: external -> `@/` aliases -> relative.
- Use `@/` aliases for `src/` imports.
- Keep comments short and only explain why.
- Revalidate path/tag after successful mutations where required.
- Ensure auth checks are layered: middleware + server/RLS.

## 4) Pre-PR Checklist (Definition of Done)

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- New/changed env vars are present in `.env.example`.
- Any schema changes exist in `db/migrations/` with RLS policies.
- Supabase types regenerated if schema changed.
- No secrets committed.
- No unintended `'use client'`.
- Pages remain thin; feature logic lives in `src/features/`.
- Error handling returns user-safe messages.
- Money/time handling follows cents + UTC rules.

## 5) Decision-to-Action Map

Use this map to convert a decision into concrete work:

1. Decision category -> identify impacted files.
2. Create checklist items before coding.
3. Implement with naming/placement rules.
4. Run lint/typecheck and fix all newly introduced issues.
5. Record any decision deviations in:
   - `docs/puretask-decisions.md`
   - `AGENTS.md` (if convention changed)

## 6) Change Protocol

When this playbook changes:
- Update this file.
- Update `docs/puretask-decisions.md` with rationale.
- Update `AGENTS.md` if coding conventions changed.
- Mention the change in the active phase doc if it affects ongoing work.
