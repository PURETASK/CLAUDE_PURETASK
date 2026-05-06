# PureTask

Trust-first cleaning marketplace (Northern California). This repo is the Next.js app plus planning docs and SQL migrations.

## Quick start

Requires **Node.js 20 or 22** and **pnpm**. If `pnpm` is missing:

```bash
corepack enable
corepack prepare pnpm@10.12.1 --activate
```

If you still have `package-lock.json` from an npm bootstrap, remove it and run `pnpm install`.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |

## Layout

| Path | Contents |
| --- | --- |
| `AGENTS.md` | Rules for AI assistants and humans |
| `docs/` | Product guide, decisions, handoffs, phase specs |
| `docs/phases/` | Phase specs (e.g. `phase-1-spec.md`) |
| `db/migrations/` | Numbered Postgres migrations (`0001_` … `0008_`) |
| `db/seed.sql` | Optional dev seed (empty placeholder) |
| `src/` | Next.js App Router application code |

## Docs

- **Product:** `docs/PureTask_Master_Guide.md`
- **Decisions:** `docs/puretask-decisions.md`
- **Phase 1 checklist:** `docs/phases/phase-1-spec.md`
- **DB handoff:** `docs/CLAUDE_CODE_HANDOFF.md`

## Repo note

The folder may still be named `CLAUDE_PURETASK` on disk; the **package name** is `puretask`. Rename the directory when convenient; it does not affect builds.
