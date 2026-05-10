# AGENTS.md

> **Purpose:** Project rules and conventions for AI coding assistants (Claude Code, Cursor, etc.).
> Read this file at the start of every session before writing or editing code.
> For the *why* behind any rule, see `docs/puretask-decisions.md`.

---

## 1. Product context

**PureTask** is a trust-first cleaning marketplace for Northern California. Customers book vetted residential cleaners and pay only when work is verified through photos, GPS check-in/out, and customer approval. Cleaners progress through 4 tiers (Rising Pro → Proven Specialist → Top Performer → All-Star Expert), earning higher rate caps and lower platform commissions as they prove themselves.

The full product spec lives in `docs/PureTask_Master_Guide.md`. Read it before working on any feature you don't have context on.

---

## 2. Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components by default |
| Language | TypeScript | strict mode on |
| Runtime | Node.js 20 LTS or 22 LTS | |
| Package manager | pnpm | Never mix with npm/yarn |
| Database | Supabase (Postgres) | RLS enabled on every user-data table |
| Auth | Supabase Auth | email/password to start |
| Styling | Tailwind CSS | utility-first |
| UI primitives | shadcn/ui | components copied into repo |
| Icons | lucide-react | |
| Forms | react-hook-form + zod | |
| Date | date-fns | |
| Server data fetching | direct DB queries in Server Components | |
| Client data fetching | TanStack Query (`@tanstack/react-query`) | |
| Hosting | Vercel | |
| Payments | Stripe (Connect + Customer) | |
| Identity verification | Stripe Identity | |
| Background checks | Checkr | |

---

## 3. Folder structure

```
puretask/
├── src/
│   ├── app/                     # Next.js routes — keep pages thin
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (do not edit unless updating shadcn)
│   │   └── shared/              # Project-wide reusable components
│   ├── features/                # Feature-scoped code
│   │   ├── booking/
│   │   ├── cleaner/
│   │   ├── customer/
│   │   ├── trust/               # scoring, tiers, badges
│   │   ├── disputes/
│   │   └── payments/
│   ├── lib/
│   │   ├── supabase/            # server.ts, browser.ts, middleware.ts
│   │   ├── stripe/
│   │   ├── checkr/
│   │   └── utils/
│   ├── server/                  # Server-only helpers shared across features
│   ├── types/
│   │   └── database.ts          # auto-generated from Supabase schema
│   └── styles/
├── db/
│   ├── migrations/              # *.sql migrations, applied in order
│   └── seed.sql
├── docs/                        # PureTask_Master_Guide.md, decisions, phase specs
├── public/
├── tests/                       # E2E tests (later phases)
├── .env.local                   # gitignored
├── .env.example                 # committed template
├── AGENTS.md                    # this file
└── package.json
```

**Rules:**
- A feature's UI, server actions, types, and validation all live in `src/features/<feature>/`.
- Pages in `src/app/` are thin wrappers — they import from `src/features/`.
- `src/components/shared/` is for genuinely reusable UI (used in 2+ features).
- Never put business logic in `src/components/`.

---

## 4. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Component file | PascalCase | `CleanerProfileCard.tsx` |
| Other code file | kebab-case | `format-currency.ts` |
| Folder | kebab-case | `cleaner-profile/` |
| Component | PascalCase | `CleanerProfileCard` |
| Hook | camelCase, `use` prefix | `useCurrentUser` |
| Server action | camelCase, `Action` suffix | `createBookingAction` |
| DB column | snake_case | `scheduled_at`, `cleaner_id` |
| Constant | SCREAMING_SNAKE_CASE | `PHOTO_DELETION_DAYS` |
| Type / interface | PascalCase, no `I` prefix | `Booking`, `MatchScore` |
| Boolean | prefix `is`/`has`/`can`/`should` | `isActive`, `hasInsurance` |

---

## 5. Code style

- **Imports:** sorted (external → `@/` aliases → relative). Use `@/` for any path inside `src/`.
- **Exports:** named exports only, except Next.js `page.tsx`/`layout.tsx`/`error.tsx`/`loading.tsx` (which require default exports).
- **Functions:** arrow functions for components and most utilities; use `function` only when hoisting required.
- **Comments:** explain *why*, not *what*. JSDoc for public-API functions.
- **No `any`:** if TypeScript fights you, fix the types — don't escape with `any`. Use `unknown` if truly unknown.
- **No barrel files (`index.ts` re-exports) inside `src/features/`:** they hurt tree-shaking and slow IDE.

---

## 6. Server vs. client patterns

- **Default to Server Components.** Add `'use client'` only when you need state, effects, browser APIs, or event handlers.
- **Server actions** for mutations triggered by your own UI (forms). Return `{ ok: true, data } | { ok: false, error }` — never throw across the boundary except for programmer errors.
- **API routes** (route handlers) only for webhooks and third-party callbacks (Stripe, Checkr).
- **Data fetching:**
  - In Server Components: `await` queries directly using the server Supabase client.
  - In Client Components: TanStack Query. Never fetch in `useEffect`.
- **After mutations:** call `revalidatePath()` or `revalidateTag()` to refresh the cache.

---

## 7. Database rules

- Schema source of truth: `db/migrations/*.sql`. **Never edit schema in Supabase Studio.**
- Regenerate `src/types/database.ts` after every schema change: `pnpm supabase gen types typescript`.
- **RLS on for every user-data table.** Policies live in the migration that creates the table.
- Three Supabase clients, each in `src/lib/supabase/`: `server.ts`, `browser.ts`, `middleware.ts`. **Never** import the wrong one.
- Money: store as integer cents (`bigint`), not dollars.
- Timestamps: `timestamptz` always. UTC in DB; convert to user's TZ at display.

---

## 8. Forms & validation

- Every form: `react-hook-form` + `zod` resolver.
- Validation schemas live in `src/features/<feature>/validation.ts` and are imported by both the form *and* the server action.
- Server actions re-validate the same schema. **Never trust client validation alone.**
- Error display: inline field errors below inputs, form-level errors in a top banner, system errors via toast.

---

## 9. Auth patterns

- Auth checks happen in `src/middleware.ts` (route-level redirects) AND in server queries (RLS).
- Read session in Server Components via the server Supabase client.
- Sign-out is always a server action.
- Tokens live in httpOnly cookies. **Never `localStorage`.**

---

## 10. Error handling

- Server action returns: `{ ok: true, data } | { ok: false, error: string }`.
- Use `error.tsx` files for React error boundaries at the route segment level.
- User-facing errors map through `src/lib/utils/format-error.ts` to friendly strings.
- Specific known errors → specific message. Unknown errors → "Something went wrong, please try again."

---

## 11. Environment variables

- Dev secrets in `.env.local` (gitignored).
- A committed `.env.example` lists every required variable with placeholder values.
- Validate env vars at startup with a `zod` schema in `src/lib/env.ts`. Fail loud on missing.
- `NEXT_PUBLIC_` prefix **only** for genuinely public values. Stripe secrets, service-role keys, Checkr keys: **no prefix.**

---

## 12. Money & currency

- Store as integer cents (`bigint`).
- Format for display via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- Never use floats for money calculations.

---

## 13. Always

- Run `pnpm lint` and `pnpm typecheck` before committing.
- Update `docs/puretask-decisions.md` if you make a project-level decision.
- Use the `@/` alias instead of relative paths going up directories.
- Match the existing patterns in the codebase — read 2–3 nearby files before adding a new one.
- When in doubt about a domain decision, ask the human (founder).

---

## 14. Never

- Never edit `src/components/ui/` shadcn primitives — they are managed by the shadcn CLI.
- Never use `any` to silence TypeScript.
- Never fetch in `useEffect` if a server action or TanStack Query would do.
- Never store money as floats.
- Never skip RLS on a new user-data table.
- Never log PII (photo URLs, full addresses, names with addresses, payment info, passwords).
- Never commit `.env.local` or any file with real secrets.
- Never mix package managers — pnpm only.
- Never push directly to `main` — always go through a PR (even solo).
- Never edit schema in Supabase Studio for changes meant to ship.
- Never use `'use client'` on a file that doesn't need it.
- Never invent conventions when one is documented here.

---

## 15. When you're not sure

If a decision needed to write code is not covered here or in `docs/puretask-decisions.md`:

1. **Stop.**
2. Ask the human in plain language what they want.
3. Don't pick the "AI default" silently.

---

## 16. Where to find things

| Need | Location |
|---|---|
| Why a decision was made | `docs/puretask-decisions.md` |
| Full product spec | `docs/PureTask_Master_Guide.md` |
| Current phase spec | `docs/phases/phase-N-spec.md` |
| Schema | `db/migrations/*.sql` |
| Schema types | `src/types/database.ts` (auto-generated) |
| Validation schemas | `src/features/<feature>/validation.ts` |
| Server actions | `src/features/<feature>/actions.ts` |

---

**Last updated:** Pre-Phase 1
