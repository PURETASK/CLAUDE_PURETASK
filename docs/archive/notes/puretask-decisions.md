# PureTask — Project Decisions Catalog

**Purpose:** A complete, beginner-friendly catalog of every project-level decision that needs to be made for PureTask, organized by category.
**How to read this:** Skim it once end-to-end so you know what's been decided. Come back to specific sections when you have questions about _why_ something is set up a particular way.
**Status:** Recommendations locked unless explicitly marked as "Open."

---

## How to read each entry

Every decision in this document follows the same structure:

- **The decision** — what we are choosing
- **Why it matters** — what could go wrong if we ignore it (in plain English)
- **Recommendation** — what we are picking
- **The alternative we're rejecting** — what others might suggest, and why we're not doing it

If your eyes glaze over, skip to the **Recommendation** line and trust it. Come back later when you hit something that's confusing.

---

# Category 1 — Framework, Language & Runtime

## 1.1 — Which JavaScript framework?

- **Why it matters:** The framework dictates how your pages are built, how data flows, and how your app is deployed. Picking wrong means rewriting in 6 months.
- **Recommendation:** **Next.js 15 with the App Router.** This is locked in the master guide.
- **Alternative rejected:** Plain React + Vite, Remix, SvelteKit. Next.js is what most marketplaces ship on, has the best Supabase + Vercel ecosystem support, and makes server-side work easy.

## 1.2 — TypeScript or JavaScript?

- **Why it matters:** TypeScript catches bugs before they reach production. For a beginner, it's harder to learn but pays back massively when refactoring.
- **Recommendation:** **TypeScript, strict mode enabled.** Worth the early friction.
- **Alternative rejected:** Plain JavaScript or "TypeScript loose mode." A bug-prone marketplace with money flowing through it should not skimp here.

## 1.3 — Node.js version?

- **Why it matters:** Next.js 15 requires modern Node. Old Node = mysterious build errors.
- **Recommendation:** **Node.js 20 LTS or Node.js 22 LTS** (Long-Term Support release).
- **Alternative rejected:** Node 18 (end-of-life soon) or odd-numbered versions (unstable).

## 1.4 — Package manager?

- **Why it matters:** This is the tool you use to install libraries (`npm install`, etc.). They're mostly equivalent, but mixing them in one project breaks things.
- **Recommendation:** **`pnpm`** — fast, disk-efficient, fewer "phantom dependency" bugs.
- **Alternative rejected:** `npm` is fine but slower and uses more disk. `yarn` is fading. **Pick one and never run another in this repo.**

## 1.5 — Module system?

- **Why it matters:** Next.js 15 uses ES Modules. You don't need to think about it — but if you copy old tutorials using `require()`, things break.
- **Recommendation:** **ES Modules only.** `import x from 'y'` syntax everywhere.
- **Alternative rejected:** CommonJS (`require()`).

---

# Category 2 — Folder & File Structure

This is one of the most consequential choices because it shapes how every future file gets organized. Get this right once and you stop having to think about it.

## 2.1 — `src/` directory or top-level?

- **Why it matters:** Where does your code live in the repo? With `src/`, your code is separated from config files. Without it, everything is at the root.
- **Recommendation:** **Use `src/`.** Cleaner separation between code and config.
- **Alternative rejected:** Top-level `app/` next to `package.json`. Workable but messier.

## 2.2 — Top-level folder layout

- **Why it matters:** Every file you create has to go somewhere. Without convention, you end up with files duplicated, scattered, or impossible to find.
- **Recommendation:**

```
puretask/
├── src/
│   ├── app/                 # Next.js routes (pages)
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   └── shared/          # Project-specific shared components
│   ├── features/            # Feature-scoped code (booking, cleaner, etc.)
│   ├── lib/                 # Utilities, helpers, integrations
│   │   ├── supabase/        # Supabase clients
│   │   ├── stripe/          # Stripe utilities
│   │   └── utils/           # Generic utilities
│   ├── server/              # Server-only code (server actions, API helpers)
│   ├── types/               # Shared TypeScript types
│   └── styles/              # Global CSS
├── db/
│   └── migrations/          # SQL migration files
├── public/                  # Static assets
├── docs/                    # Project docs (master guide, decisions, specs)
├── tests/                   # Tests (when we add them)
├── .env.local               # Local env vars (gitignored)
├── .env.example             # Committed template
├── AGENTS.md                # Project rules for AI
└── package.json
```

- **Alternative rejected:** Pages-and-components-only structure. Doesn't scale to 54-table marketplace.

## 2.3 — Where do feature-specific files live?

- **Why it matters:** A booking page needs UI, server actions, types, validation. Splitting them across `components/`, `lib/`, `types/` makes you hunt for related files.
- **Recommendation:** **Feature folders under `src/features/`.** All booking code lives in `src/features/booking/`. Includes booking-specific components, server actions, types, and helpers.
- **Alternative rejected:** Pure type-based separation (all components in `components/`, all actions in `actions/`). Forces you to chase across the repo to make one feature change.

## 2.4 — Where do route handlers live?

- **Why it matters:** Next.js App Router puts pages inside `app/`. But colocating big page logic with reusable code creates clutter.
- **Recommendation:** **Pages stay thin in `app/`.** Heavy logic moves to `src/features/<feature>/`. The page imports from there.
- **Alternative rejected:** Putting all logic inside `app/` page files. Works for tiny apps; falls apart fast.

## 2.5 — Where do shared types live?

- **Why it matters:** TypeScript types describing your domain (Booking, Cleaner, Tier) are referenced everywhere. They need a stable home.
- **Recommendation:** **`src/types/` for shared/domain types.** Database types auto-generated to `src/types/database.ts` from Supabase. Feature-specific types live inside the feature folder.
- **Alternative rejected:** Scattering types into individual files where they're first used. Causes circular import hell.

## 2.6 — Database migrations folder

- **Why it matters:** SQL migrations are the source of truth for your schema. They need to be tracked in version control and applied in order.
- **Recommendation:** **`db/migrations/` at repo root**, with files named `0001_initial_schema.sql`, `0002_add_booking_index.sql`, etc.
- **Alternative rejected:** Burying migrations inside `src/`. They're operational, not application code.

## 2.7 — Project documentation folder

- **Why it matters:** The master guide, decisions catalog, and phase specs need to live with the code so future-you (and Claude Code) can find them.
- **Recommendation:** **`docs/` at repo root.** Master guide and decisions go here. Phase specs go in `docs/phases/`.
- **Alternative rejected:** Storing docs in a separate Notion/Google Drive. Drifts out of sync with code immediately.

## 2.8 — Test folder location

- **Why it matters:** Two patterns: tests next to code (`Component.test.tsx` next to `Component.tsx`) or separate (`tests/` folder).
- **Recommendation:** **Colocated.** Tests live next to the file they test. Easier to find. Easier to delete when you delete a feature.
- **Alternative rejected:** Separate `tests/` mirror tree. Looks tidy in screenshots; painful in practice.

---

# Category 3 — Naming Conventions

Tiny choices, but inconsistency here makes a codebase look amateur and breaks AI's ability to predict file names.

## 3.1 — File naming for components

- **Why it matters:** React components are conventionally PascalCase. Other files (utilities, configs) are conventionally kebab-case.
- **Recommendation:** **PascalCase for component files** (`BookingCard.tsx`), **kebab-case for everything else** (`format-date.ts`, `match-score.ts`).
- **Alternative rejected:** All-kebab or all-camelCase. PascalCase signals "this is a component" at a glance.

## 3.2 — Folder naming

- **Why it matters:** Some teams use camelCase folders, some kebab-case.
- **Recommendation:** **kebab-case for all folders.** `cleaner-profile/` not `cleanerProfile/`.
- **Alternative rejected:** camelCase. Causes case-sensitivity bugs on Linux deploys.

## 3.3 — React component naming

- **Why it matters:** Component names appear in error messages and React DevTools.
- **Recommendation:** **PascalCase, descriptive nouns.** `CleanerProfileCard`, `BookingTimeline`. Avoid generic names like `Card` or `Item` unless inside a feature folder.
- **Alternative rejected:** Hungarian notation (`CardCleaner`). Reads backwards.

## 3.4 — Hook naming

- **Why it matters:** React hooks must start with `use`. The rest of the team needs to know it's a hook on sight.
- **Recommendation:** **`use<DescriptiveName>`.** `useCurrentUser`, `useBookingStatus`. Always camelCase.
- **Alternative rejected:** Generic names like `useData`. Useless when grep'ing.

## 3.5 — Server action naming

- **Why it matters:** Server actions are functions that mutate data on the server. They need to be greppable and clearly distinguished from regular functions.
- **Recommendation:** **Verb-first names ending in `Action`.** `createBookingAction`, `approveBookingAction`. Inside files named `actions.ts`.
- **Alternative rejected:** Vague names (`save`, `submit`). Or using `Action` suffix inconsistently.

## 3.6 — Database column naming

- **Why it matters:** PostgreSQL convention is `snake_case`. JavaScript/TypeScript is `camelCase`. You'll need a translation layer.
- **Recommendation:** **`snake_case` for all database columns** (`scheduled_at`, `cleaner_id`). Supabase's TypeScript generator handles the case conversion. **Don't fight Postgres conventions.**
- **Alternative rejected:** camelCase columns. Quoted forever (`"createdAt"`) and ugly in raw SQL.

## 3.7 — Constants naming

- **Why it matters:** Constants should be obvious at a glance.
- **Recommendation:** **`SCREAMING_SNAKE_CASE` for true constants** (`PHOTO_DELETION_DAYS = 90`). camelCase for derived/runtime values.
- **Alternative rejected:** All camelCase. Loses the "this is fixed forever" signal.

## 3.8 — Type and Interface naming

- **Why it matters:** When reading code, you want to know what's a type vs. a value at a glance.
- **Recommendation:** **PascalCase, no `I` prefix.** `User`, `Booking`, `MatchScore`. Use `type` over `interface` unless you specifically need interface features.
- **Alternative rejected:** `IUser`, `TBooking`. Java/C# convention; not idiomatic in TypeScript.

## 3.9 — Boolean naming

- **Why it matters:** Booleans should read like questions or assertions.
- **Recommendation:** **Prefix with `is`, `has`, `can`, `should`.** `isActive`, `hasInsurance`, `canEdit`.
- **Alternative rejected:** Ambiguous nouns (`active`, `insurance`). Confusing.

## 3.10 — Default exports vs. named exports

- **Why it matters:** Default exports let you rename on import (`import Foo from './bar'` even if `bar` exports `Baz`). Named exports keep names consistent.
- **Recommendation:** **Named exports everywhere except Next.js page/layout/loading files** (those require default exports per Next.js rules).
- **Alternative rejected:** Default exports everywhere. Easy to mis-rename. Bad for refactoring.

---

# Category 4 — Code Style & Tooling

## 4.1 — Linter

- **Why it matters:** ESLint catches common mistakes before they hit production.
- **Recommendation:** **ESLint with Next.js's recommended config + TypeScript rules.** `eslint-config-next` + `@typescript-eslint/recommended`.
- **Alternative rejected:** No linter. Saves 10 minutes of setup. Costs days of debugging.

## 4.2 — Formatter

- **Why it matters:** Inconsistent indentation, semicolons, and quotes are a noise filter that hides real bugs in code review.
- **Recommendation:** **Prettier**, ESLint configured to defer to Prettier on style. Run on save.
- **Alternative rejected:** Manual formatting. Wastes brainpower; fails inconsistently.

## 4.3 — Editor settings

- **Why it matters:** Two developers (or you across two computers) with different tab/space settings = constant noisy diffs.
- **Recommendation:** **`.editorconfig` file** at repo root. 2-space indentation, LF line endings, UTF-8.
- **Alternative rejected:** Trusting per-developer config. Fails the moment you switch machines.

## 4.4 — Import order

- **Why it matters:** Random import order makes diffs noisy.
- **Recommendation:** **Auto-sorted by ESLint plugin.** Order: external (React, Next), internal absolute (`@/...`), relative (`./...`).
- **Alternative rejected:** Manual order. Forgotten within a week.

## 4.5 — Path aliases

- **Why it matters:** `import x from '../../../lib/foo'` is ugly and breaks when you move files.
- **Recommendation:** **Use `@/` alias for `src/`.** `import { foo } from '@/lib/foo'`. Configure in `tsconfig.json` and `next.config.ts`.
- **Alternative rejected:** Relative imports everywhere. Fragile.

## 4.6 — Arrow functions vs. function declarations

- **Why it matters:** Stylistic, but consistency helps readability.
- **Recommendation:** **Arrow functions for components and most utilities.** Function declarations only when hoisting is required (rare).
- **Alternative rejected:** Mixing both unpredictably.

## 4.7 — Comment style

- **Why it matters:** Comments rot fast. Bad comments are worse than none.
- **Recommendation:** **JSDoc for public API functions** (`/** ... */`). Inline `//` comments only when the code can't be made clearer with naming. **No "what" comments, only "why" comments.**
- **Alternative rejected:** Heavy commenting on obvious code (`// increment counter`). Noise.

---

# Category 5 — Database & Supabase

## 5.1 — Schema source of truth

- **Why it matters:** If schema lives in two places (Supabase Studio + migration files), they drift.
- **Recommendation:** **Migration SQL files in `db/migrations/` are the source of truth.** Apply them via Supabase CLI. Never edit schema in Supabase Studio for changes meant to ship.
- **Alternative rejected:** Editing in Studio first, "syncing back" to migrations. Always loses something.

## 5.2 — Generated database types

- **Why it matters:** Without TypeScript types matching your schema, you'll typo column names in queries and find out at runtime.
- **Recommendation:** **Run Supabase's type generator** (`supabase gen types typescript`) and commit `src/types/database.ts`. Regenerate after every schema change.
- **Alternative rejected:** Hand-writing types. Always drifts.

## 5.3 — Supabase clients: server vs. browser

- **Why it matters:** Server code needs different Supabase configuration than browser code (cookies, auth context, API keys). Mixing them up leaks secrets or breaks auth.
- **Recommendation:** **Three clients, one each:**
  - `src/lib/supabase/server.ts` — for server components and server actions
  - `src/lib/supabase/browser.ts` — for client components
  - `src/lib/supabase/middleware.ts` — for Next.js middleware (auth)
- **Alternative rejected:** One unified client. Causes hydration bugs and auth leaks.

## 5.4 — Row Level Security (RLS)

- **Why it matters:** RLS is Postgres-level access control. With it, "users can only see their own data" is enforced at the database — not just the app. Without it, a single missed query check leaks data.
- **Recommendation:** **RLS on for every table that contains user data.** Policies live in migration files alongside the table.
- **Alternative rejected:** Relying on app-layer checks. One bug and data leaks.

## 5.5 — Where do raw SQL queries live?

- **Why it matters:** Some queries are too complex for Supabase's `.from().select()` builder.
- **Recommendation:** **Postgres functions (RPC) in migration files** for complex queries. App calls `supabase.rpc('function_name', { params })`.
- **Alternative rejected:** Embedding raw SQL strings in app code. Hard to test, easy to break.

## 5.6 — Database connection pooling

- **Why it matters:** Vercel functions are stateless. Without pooling, each request opens a fresh DB connection. At scale, you exhaust Postgres.
- **Recommendation:** **Use Supabase's connection pooler URL** (port 6543) for app queries. Direct connection (port 5432) only for migrations.
- **Alternative rejected:** Direct connection in production. Will brick under load.

## 5.7 — Seed data and fixtures

- **Why it matters:** Empty database = nothing to develop against. Random hand-crafted data = fragile demos.
- **Recommendation:** **`db/seed.sql` with deterministic dev fixtures.** A few cleaners, a few bookings, a few customers. Re-runnable.
- **Alternative rejected:** Manual data entry every time you reset dev.

---

# Category 6 — Server vs. Client Boundaries

This is the area beginners get wrong most often in Next.js App Router. Get it right early.

## 6.1 — Server Components by default

- **Why it matters:** App Router defaults to Server Components — they run on the server, can hit the DB directly, and ship zero JavaScript to the client. Client Components run in the browser. **Smaller bundle, faster, simpler — until you need interactivity.**
- **Recommendation:** **Server Component by default. Add `'use client'` only when you need state, effects, or browser APIs.**
- **Alternative rejected:** `'use client'` at the top of everything. Wastes bundle size, breaks data fetching patterns.

## 6.2 — Server actions vs. API routes

- **Why it matters:** Both can run server logic. They look similar; they're not the same. Mixing them randomly creates inconsistent error handling.
- **Recommendation:**
  - **Server actions for form submissions and mutations from your own UI** (creating a booking, approving work, etc.)
  - **API routes (route handlers) for webhooks, third-party integrations, and any endpoint hit by external systems** (Stripe webhooks, Checkr callbacks)
- **Alternative rejected:** Using API routes for everything. More code, more boilerplate, weaker type safety.

## 6.3 — Data fetching pattern

- **Why it matters:** Where you fetch data shapes your loading states, error handling, and caching.
- **Recommendation:**
  - **In Server Components:** await DB queries directly. No library needed.
  - **In Client Components:** use **TanStack Query** (`@tanstack/react-query`) for client-side fetching and cache management.
- **Alternative rejected:** SWR (smaller, but TanStack is more powerful for marketplace use cases). `fetch()` with `useEffect` (rolling your own cache is a trap).

## 6.4 — Mutation flow

- **Why it matters:** Beginners often write mutations as `fetch('/api/...')` calls in client code. Next.js has a more idiomatic path.
- **Recommendation:** **Server actions invoked from forms** with `<form action={createBookingAction}>`. Use `revalidatePath()` to refresh data after mutation. Use `useFormStatus()` for loading state.
- **Alternative rejected:** `fetch('/api/booking')` from the client. More boilerplate; weaker types.

## 6.5 — Streaming and Suspense

- **Why it matters:** Slow-fetching pages can stream — show shell first, fill in slow parts. Without Suspense, the whole page blocks.
- **Recommendation:** **Wrap slow data fetches in `<Suspense fallback={<Skeleton />}>`** for the customer browse page (cleaner list takes time to compute Match Score).
- **Alternative rejected:** Block-rendering everything. Slow user experience.

---

# Category 7 — Forms & Validation

## 7.1 — Form library

- **Why it matters:** Hand-rolling forms is fine for two fields. For an 11-step cleaner application form? You need help.
- **Recommendation:** **`react-hook-form`** with `zod` resolver for validation. Industry standard, performant, great TypeScript support.
- **Alternative rejected:** Formik (slower to update). Native HTML forms (fine for tiny forms; fails for complex ones).

## 7.2 — Validation library

- **Why it matters:** You need to validate inputs both on the client (UX) and server (security). Without one schema, you write validation twice.
- **Recommendation:** **`zod`** — define schema once, use on client and server. Zod schemas also generate TypeScript types automatically.
- **Alternative rejected:** Yup (older), Joi (server-only). Zod is the current default.

## 7.3 — Where validation schemas live

- **Why it matters:** Validation schemas reference fields that exist in your domain. They should live close to the feature.
- **Recommendation:** **Per-feature `validation.ts` files.** `src/features/booking/validation.ts` exports `bookingFormSchema`. Imported by both the form and the server action.
- **Alternative rejected:** One mega-schema file. Breaks at scale.

## 7.4 — Error display

- **Why it matters:** Users need to know what went wrong, not just "something failed."
- **Recommendation:** **Inline field errors** below each input (red text, small). **Form-level errors** in a banner at top. **System errors** (500s) as a toast.
- **Alternative rejected:** Generic alert dialogs. Bad UX.

---

# Category 8 — Authentication & Session Patterns

## 8.1 — Auth provider

- **Why it matters:** Locked in master guide.
- **Recommendation:** **Supabase Auth.** Email/password to start. Magic links and OAuth deferred.
- **Alternative rejected:** Auth0, Clerk, NextAuth. Each has merits. Supabase Auth integrates cleanly because we're already on Supabase.

## 8.2 — Session storage

- **Why it matters:** Auth tokens have to live somewhere. Insecure storage = stolen sessions.
- **Recommendation:** **Cookies, set by Supabase Auth, httpOnly and Secure flags.** Never put tokens in localStorage.
- **Alternative rejected:** localStorage tokens. Susceptible to XSS attacks.

## 8.3 — Where do we check auth?

- **Why it matters:** Protected routes need to verify the user is logged in. Doing this in many places = bugs and inconsistency.
- **Recommendation:** **Next.js middleware** (`src/middleware.ts`) checks auth and redirects unauthenticated users from protected routes. Server components additionally read the session via the server Supabase client.
- **Alternative rejected:** Per-page auth checks only. Fragile; one missed check leaks pages.

## 8.4 — Role-based access

- **Why it matters:** Customers, cleaners, and admins see different things. The `users` table has a role; routes need to enforce it.
- **Recommendation:** **Role check in middleware AND in server queries** (RLS at database level). Belt and suspenders. Layered defense.
- **Alternative rejected:** Trusting the client to "know" what it should show.

## 8.5 — Sign-out flow

- **Why it matters:** Sign-out has to clear session cookies on both client and server. Skipping the server side leaves stale sessions.
- **Recommendation:** **Sign-out is a server action** that calls Supabase's signOut() and redirects. Cookies cleared automatically.
- **Alternative rejected:** Client-only sign-out. Leaves session valid on next refresh.

---

# Category 9 — Error Handling & Logging

## 9.1 — Server error handling pattern

- **Why it matters:** Server actions can fail. The UI needs to know — without crashing.
- **Recommendation:** **Server actions return a discriminated union:** `{ ok: true, data } | { ok: false, error: string }`. Never throw across the server/client boundary unless it's a programmer error.
- **Alternative rejected:** Throwing exceptions everywhere. Stack traces leak to users; UX is worse.

## 9.2 — Client error boundaries

- **Why it matters:** React errors crash the whole tree without an error boundary.
- **Recommendation:** **Use Next.js `error.tsx` files** at the route segment level. Custom global `error.tsx` at app root with friendly UI.
- **Alternative rejected:** Letting errors crash. Brand-killer.

## 9.3 — Logging library

- **Why it matters:** `console.log` is fine in dev but noise in production.
- **Recommendation:**
  - **Phase 1–6:** `console.log`/`console.error` in dev. Vercel captures them.
  - **Phase 7+ (when there's real traffic):** Migrate to a structured logger (e.g., `pino`).
  - **Add error tracking (Sentry) before launch**, not after.
- **Alternative rejected:** Setting up Sentry on day one. Premature complexity.

## 9.4 — What to log

- **Why it matters:** Logging too much = noise + privacy risk. Logging too little = blind in production.
- **Recommendation:**
  - **Always log:** server errors, payment failures, auth failures, dispute events.
  - **Never log:** passwords, full card numbers, photo URLs, full addresses, full names with addresses.
- **Alternative rejected:** Logging everything ("we'll filter later"). PII exposure risk.

## 9.5 — User-facing error UX

- **Why it matters:** "Error: ECONNRESET" is not an answer to a customer.
- **Recommendation:** **Map all server errors to user-friendly messages** at the boundary. Use a single helper (`src/lib/utils/format-error.ts`). Show specific messages for known errors; generic "something went wrong, please try again" for unknown.
- **Alternative rejected:** Showing raw errors. Confuses users; leaks internals.

---

# Category 10 — Environment & Secrets

## 10.1 — Where env vars live in dev

- **Why it matters:** Putting Supabase keys in code is a security disaster.
- **Recommendation:**
  - **`.env.local`** — your private dev secrets. **Gitignored.**
  - **`.env.example`** — committed template with all variable names and dummy values.
- **Alternative rejected:** Hardcoding secrets. Or committing `.env`. Real disasters.

## 10.2 — Where env vars live in production

- **Why it matters:** Vercel needs to know your prod keys without them ever touching your repo.
- **Recommendation:** **Vercel project environment variables**, set via dashboard. Three environments: Development, Preview, Production — each with separate values.
- **Alternative rejected:** One shared env across environments. One mistake = production wiped.

## 10.3 — Public vs. private env vars

- **Why it matters:** Next.js exposes any var prefixed `NEXT_PUBLIC_` to the browser. Putting a secret behind that prefix leaks it.
- **Recommendation:** **`NEXT_PUBLIC_` only for truly public values** (Supabase anon key, public site URL). Service role keys, Stripe secret keys, Checkr keys: **no prefix.**
- **Alternative rejected:** Casual `NEXT_PUBLIC_` use. One mistake leaks Stripe secret to every browser.

## 10.4 — Validating env vars at boot

- **Why it matters:** Missing env var → mysterious runtime error 30 seconds into your first request.
- **Recommendation:** **Validate env vars at startup** with a `zod` schema in `src/lib/env.ts`. Crash with clear error if anything missing.
- **Alternative rejected:** Hoping. Fails noisily and late.

---

# Category 11 — Styling & UI Components

## 11.1 — CSS approach

- **Why it matters:** Locked in master guide.
- **Recommendation:** **Tailwind CSS.** Inline utility classes. Component primitives from shadcn/ui.
- **Alternative rejected:** CSS modules, styled-components. Slower iteration; harder for AI to assist.

## 11.2 — Component library

- **Why it matters:** Locked in master guide.
- **Recommendation:** **shadcn/ui.** Components copied into your codebase (you own them, can edit). Built on Radix UI primitives + Tailwind.
- **Alternative rejected:** Material UI, Chakra, Ant Design. Heavier, harder to customize, less idiomatic for the Tailwind world.

## 11.3 — Icon library

- **Why it matters:** Tiny but unifying.
- **Recommendation:** **`lucide-react`.** Consistent, ships with shadcn/ui, free, large set.
- **Alternative rejected:** Heroicons, react-icons. Both fine; Lucide is the shadcn default.

## 11.4 — Theme system

- **Why it matters:** Light mode now, dark mode later. CSS variables make this trivial; hardcoded colors don't.
- **Recommendation:** **CSS variables for theme tokens** (defined by shadcn). Colors named semantically (`--primary`, `--muted-foreground`), not by hue.
- **Alternative rejected:** Hardcoded hex codes. Refactor hell when you add dark mode.

## 11.5 — Design tokens

- **Why it matters:** Pixel inconsistencies (12px gap one place, 14px another) make designs feel unprofessional.
- **Recommendation:** **Tailwind's spacing scale only.** `p-4` (16px), `gap-6` (24px). Avoid arbitrary values like `p-[13px]` unless absolutely necessary.
- **Alternative rejected:** Mixing arbitrary pixel values. Visual chaos.

---

# Category 12 — Date, Time & Currency

## 12.1 — Date library

- **Why it matters:** Native `Date` is awkward for arithmetic, formatting, time zones. The booking system has time zones everywhere.
- **Recommendation:** **`date-fns`.** Modular, tree-shakeable, no time zone library required (use IANA-named time zones via `Intl`).
- **Alternative rejected:** Moment (deprecated), Day.js (smaller but less powerful for time zone arithmetic).

## 12.2 — Time zone handling

- **Why it matters:** Cleaners and customers in NorCal — but server is UTC. Booking times displayed wrong = trust killed.
- **Recommendation:**
  - **Store all timestamps in UTC** (Postgres `timestamptz`).
  - **Display in customer's local time zone** (default: `America/Los_Angeles`).
  - **Schedule cron jobs in Pacific time** (the 2am score calc, Friday noon payouts).
- **Alternative rejected:** Storing in local time. Disaster on daylight saving days.

## 12.3 — Currency representation

- **Why it matters:** Floats are inexact. `0.1 + 0.2 = 0.30000000000000004`. With money, this matters.
- **Recommendation:** **Store all money as integer cents** in Postgres (`bigint`). Convert to dollars only at display time. Format with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- **Alternative rejected:** Storing dollars as floats. Loses pennies; sometimes generates audit nightmares.

## 12.4 — Date input controls

- **Why it matters:** Browser-native date pickers are inconsistent across devices.
- **Recommendation:** **shadcn/ui's date picker** (built on react-day-picker). Consistent UX everywhere.
- **Alternative rejected:** `<input type="date">`. Different on every browser/mobile platform.

---

# Category 13 — Git, Branching & Deploy

## 13.1 — Git platform

- **Why it matters:** Where the code lives.
- **Recommendation:** **GitHub.** Most ecosystem support; integrates with Vercel cleanly.
- **Alternative rejected:** GitLab, Bitbucket. Both fine; GitHub is path of least resistance.

## 13.2 — Branching model

- **Why it matters:** Solo founder doesn't need GitFlow. But "everything on main" loses you a safety net.
- **Recommendation:**
  - **`main`** — production. Always deployable.
  - **Feature branches** — one per task. Merged to main via PR.
  - **No `dev` or `staging` branch yet.** Vercel preview deploys give you per-branch staging.
- **Alternative rejected:** Long-lived `dev` branch. Forgotten merge conflicts.

## 13.3 — Commit message format

- **Why it matters:** Future-you reading "fixed bug" tells you nothing. Good commit messages let you bisect.
- **Recommendation:** **Conventional commits.** `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`. One sentence body explaining _why_.
- **Alternative rejected:** Free-form ("updates", "wip"). Useless when debugging.

## 13.4 — Pull requests for solo work?

- **Why it matters:** PRs feel like overhead when you're the only dev. But they give you preview URLs and a safety pause.
- **Recommendation:** **Yes, even solo.** Each PR auto-creates a Vercel preview URL. You can click around before merging. AI can review the diff. Worth the 30 seconds.
- **Alternative rejected:** Direct pushes to main. Loses the preview-before-merge benefit.

## 13.5 — Deploy platform

- **Why it matters:** Locked in master guide.
- **Recommendation:** **Vercel.** Built by the Next.js team; zero-config; generous free tier.
- **Alternative rejected:** Netlify, AWS, Render. All workable; Vercel is the path of least friction.

## 13.6 — Domain setup

- **Why it matters:** `puretask.com` looks more legit than `puretask.vercel.app` to early customers and cleaners.
- **Recommendation:** **Buy domain in Pre-Phase 1** (it's $12/year). Connect to Vercel later. Don't block on this.
- **Alternative rejected:** Skipping it. Hurts perception when you start cleaner recruitment.

---

# Category 14 — Testing Strategy

## 14.1 — When do we start writing tests?

- **Why it matters:** Tests for a non-existent product are vanity. Tests for production code paying real money are mandatory.
- **Recommendation:**
  - **Phase 1–4:** No tests yet. Move fast, learn the framework.
  - **Phase 5+:** Start writing tests for:
    - The Match Score algorithm (pure function, easy to test, high stakes)
    - The reliability score calculation
    - The tier-aware commission engine
    - Webhook handlers (Stripe, Checkr)
  - **Before launch:** End-to-end tests with Playwright covering: signup, booking flow, payout flow.
- **Alternative rejected:** TDD from day one (slow). No tests ever (irresponsible at launch).

## 14.2 — Test framework

- **Why it matters:** Picking wrong = abandoned tests.
- **Recommendation:** **Vitest** for unit tests. **Playwright** for E2E. Both have great Next.js integration.
- **Alternative rejected:** Jest (slower, more config). Cypress (E2E only, less powerful than Playwright).

## 14.3 — What to test first

- **Why it matters:** Your time is finite. Test what's important and risky.
- **Recommendation:** **Pure business logic functions** first (score calc, commission calc, tier logic). They're easiest to test and have the highest cost-of-bug ratio.
- **Alternative rejected:** Testing UI components first. Slower; less leverage.

---

# Category 15 — Open Decisions (revisit during build)

These are intentionally deferred. Don't decide now; decide when context demands it.

| #    | Decision                                         | When to decide                                | Why deferred                                   |
| ---- | ------------------------------------------------ | --------------------------------------------- | ---------------------------------------------- |
| 15.1 | Email service (SendGrid, Resend, Postmark)       | Phase 4 (when admin sends application emails) | Pick once you know your real email volume      |
| 15.2 | Push notification provider (OneSignal, Firebase) | Phase 6 (when "On my way" pings customers)    | Need real device support requirements          |
| 15.3 | SMS provider (Twilio, MessageBird)               | Phase 6 (cleaner pre-arrival SMS option)      | Cost varies by volume                          |
| 15.4 | Analytics (PostHog, Mixpanel, Amplitude)         | Phase 10 (when you have users)                | Premature data without traffic                 |
| 15.5 | Customer support chat (Intercom, Crisp)          | Phase 10                                      | Manual support fine until volume               |
| 15.6 | Image CDN (Cloudflare Images, Imgix)             | Phase 6 (photo system)                        | Maybe not needed; Supabase Storage may suffice |
| 15.7 | Background job queue (Inngest, Trigger.dev)      | Phase 7 (cron jobs)                           | Vercel Cron may suffice for most jobs          |

---

# Appendix A — Beginner traps to avoid

These are things that look reasonable but cause real pain. Forearm yourself.

- **Mixing package managers.** If you ever ran `npm install` in this repo, never run `pnpm install` after. Pick one. Stay.
- **Using `'use client'` everywhere.** The default is server. Only opt out when you must.
- **Storing money as floats.** Always integer cents. Always.
- **Logging PII.** Photos, addresses, full names, payment info. Don't.
- **Editing schema in Supabase Studio.** Migration files are the source of truth. Edit there.
- **Skipping RLS.** "I'll add it later" = data leak.
- **Hardcoding colors.** Use Tailwind tokens or CSS variables.
- **Skipping `.env.example`.** Future-you (or a contractor) won't know what env vars exist.
- **Long-lived branches.** Merge weekly minimum. Conflicts grow exponentially.
- **Putting tests off forever.** Phase 5+ is the latest you should start.
- **Trusting AI to "just know" your conventions.** The whole point of `AGENTS.md` is so it does.

---

# Appendix B — Decision change protocol

When you need to change a decision in this catalog:

1. Update the relevant section in this file.
2. Add a line at the bottom: `Updated [date]: changed [X] from [Y] to [Z] because [why].`
3. If the change affects code conventions, update `AGENTS.md` too.
4. If the change is mid-build, note it in the phase spec.

This is the difference between a working catalog and a fossilized one.

---

**End of Decisions Catalog.**
