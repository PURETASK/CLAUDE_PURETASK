## Summary
- What changed?
- Why was this needed?

## Decisions Compliance Checklist
- [ ] I followed `docs/puretask-build-playbook.md`.
- [ ] I followed the relevant category playbook(s) in `docs/playbooks/`.
- [ ] Pages are thin and feature logic lives in `src/features/<feature>/`.
- [ ] Naming conventions are followed (files, folders, symbols, actions).
- [ ] Server/client boundaries are correct (`'use client'` only where needed).
- [ ] Forms use `react-hook-form` + `zod` (if forms were added/changed).
- [ ] Server actions return `{ ok: true, data } | { ok: false, error }` for expected failures.
- [ ] No secrets are exposed via `NEXT_PUBLIC_*` vars.
- [ ] No PII/secrets were logged.

## Database and Supabase (if applicable)
- [ ] Schema changes are in `db/migrations/` (not only in Supabase Studio).
- [ ] RLS policies added/updated for affected user-data tables.
- [ ] `src/types/database.ts` regenerated after schema changes.
- [ ] Correct Supabase clients are used by runtime (server/browser/middleware).

## Quality Gates
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] Manual smoke checks done for changed flows.

## Deployment and Risk
- [ ] Any new env vars are in `.env.example`.
- [ ] Vercel env vars updated if required.
- [ ] Known risks or follow-ups are listed below.

## Follow-ups
- None.
