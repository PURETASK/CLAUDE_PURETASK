# Phase 7 — Testing Foundation & Dev Tooling

## Goal

Establish the automated testing baseline required before real money and real users touch the platform. Per the decisions catalog (§14.1), tests should have started by Phase 5; Phase 7 is the catch-up point before any payment or trust-critical features land.

## Scope

### 7.1 — Vitest unit tests for pure business logic

Test every function whose bug has a direct dollar or trust cost:

| File | Function | Risk |
|---|---|---|
| `src/features/discovery/scoring.ts` | `computeMatchScore` | Wrong score → wrong cleaner ranked #1 |
| `src/features/booking/pricing.ts` | `computeBookingPricing` | Wrong math → underpaid cleaners or overcharged customers |

### 7.2 — Extract pricing math to a pure module

`computeBookingPricing` pulled out of `createBookingAction` into `src/features/booking/pricing.ts` so it can be tested without touching Next.js or Supabase.

### 7.3 — Vitest + testing infrastructure

- Vitest 4.x with `jsdom` environment
- `@vitejs/plugin-react` for React component testing in future phases
- `@vitest/coverage-v8` for coverage reports
- `vitest.config.ts` with `@/` alias mirroring `tsconfig.json`
- `test`, `test:watch`, `test:coverage` scripts in `package.json`
- Tests colocated next to source files (per §2.8)

### 7.4 — ESLint fix: exclude `.claude/` worktrees

`.claude/**` added to ESLint ignores — it was picking up Claude Code worktree files and generating thousands of false errors.

### 7.5 — Install missing AGENTS.md locked-stack packages

| Package | Role | Was missing |
|---|---|---|
| `date-fns` | Date arithmetic and formatting | Yes |
| `@tanstack/react-query` | Client-side data fetching | Yes |
| `lucide-react` | Icon library | Yes |

## What's NOT in Phase 7

- Playwright E2E tests — deferred until payment/payout flow complete
- Background job queue (Inngest/Trigger.dev) — assess after Phase 8
- Structured logging (pino) — deferred until real traffic exists

## Completion criteria

- [x] All pure business logic functions have unit tests
- [x] `pnpm test` runs clean (0 failures)
- [x] `pnpm lint` runs clean
- [x] Missing locked-stack packages installed
