# Phase 1 — Foundation Spec

> **Goal:** Working Next.js 15 project deployed to Vercel, connected to Supabase dev, with all conventions in place. A "hello world" you can visit on the public internet.
> **Estimated time:** 1–2 weeks for a beginner. Don't rush — the conventions you set now save you from refactoring for the next 9 months.
> **Prerequisites:** Pre-Phase 1 items partially complete (lawyer engaged, production Supabase project created). Domain registration optional but recommended.

---

## Acceptance criteria — Phase 1 is "done" when:

You can check off **all** of these:

- [ ] `pnpm dev` runs and shows your home page on `http://localhost:3000`
- [ ] `pnpm build && pnpm start` runs the production build locally with no errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm typecheck` passes with zero errors
- [ ] Pushing to `main` triggers an automatic Vercel deploy
- [ ] Production URL (e.g., `puretask.vercel.app`) shows your home page over HTTPS
- [ ] Opening preview branch URL works (push to a feature branch, see preview)
- [ ] Supabase dev client successfully reads from at least one table from inside a Server Component
- [ ] Environment variables validated at startup; missing vars cause clear failure messages
- [ ] `AGENTS.md` and `docs/puretask-decisions.md` are committed in the repo
- [ ] Your editor (Cursor / VS Code) recognizes the `@/` alias and shows TypeScript errors live

If any of these fail, Phase 1 is not done. Don't move on. The whole rest of the build sits on this foundation.

---

## What's intentionally NOT in Phase 1

These come later. Don't get pulled into them:

- ❌ Auth flow / sign-in pages → Phase 2
- ❌ User profile pages → Phase 3
- ❌ Database schema (beyond a smoke test) → Pre-Phase 1 schema dump goes in `db/migrations/` but full app integration waits for relevant phases
- ❌ Stripe, Checkr, anything paid → Phase 4+
- ❌ Real branding / logo / fonts → Phase 10
- ❌ Tests → Phase 5+

---

## Pre-flight checklist (do these on your local machine, once)

Before Task 1, make sure your environment is ready:

| Tool              | Version          | Install / verify command                    |
| ----------------- | ---------------- | ------------------------------------------- |
| Node.js           | 20 LTS or 22 LTS | `node --version`                            |
| pnpm              | latest           | `npm install -g pnpm` then `pnpm --version` |
| git               | any modern       | `git --version`                             |
| Cursor or VS Code | latest           | open and sign in                            |

Also create accounts for (free tiers fine):

- [ ] **GitHub** — for repo
- [ ] **Vercel** — sign up with GitHub for one-click linking
- [ ] **Supabase** — confirm dev project exists from Pre-Phase 1

---

# Tasks

Each task includes: **Goal** (one line), **Why** (plain-English context), **Steps** (numbered), **Verify** (how to check it worked), **Common mistakes** (beginner traps).

When you (or Claude Code, or Cursor's agent) are working a task, treat it as one unit. Finish, verify, commit, then move on. Don't bundle.

---

## Task 1 — Initialize the Next.js project

**Goal:** Get a Next.js 15 + TypeScript + Tailwind project on disk.

**Why:** This is the skeleton everything else hangs off of. Use the official Next.js installer — it sets defaults correctly.

**If this repo is already bootstrapped** (you see `package.json`, `src/app/`, and `pnpm dev` works from the repo root), treat Task 1 as done and skip to Task 2.

**Steps:**

1. Open a terminal in the directory where you want the project to live (e.g., `~/code/`).
2. Run: `pnpm create next-app@latest puretask`
3. When prompted, answer:
   - TypeScript: **Yes**
   - ESLint: **Yes**
   - Tailwind CSS: **Yes**
   - `src/` directory: **Yes**
   - App Router: **Yes**
   - Turbopack for `next dev`: **Yes**
   - Customize import alias: **Yes** → set to `@/*`
4. `cd puretask`
5. `pnpm dev`
6. Visit `http://localhost:3000` — you should see the default Next.js welcome page.
7. Stop the server (`Ctrl+C`).

**Verify:**

- `pnpm dev` works.
- The page renders.
- `tsconfig.json` includes `"paths": { "@/*": ["./src/*"] }`.

**Common mistakes:**

- Saying No to `src/` — sets up a worse structure.
- Saying No to TypeScript — irreversible cost down the line.
- Running `npm install` somewhere by accident — creates a `package-lock.json` that fights `pnpm`. Delete it if it appears.

---

## Task 2 — Initialize git and connect to GitHub

**Goal:** Repo on GitHub, first commit pushed.

**Why:** You need version control before you do anything else. Pushing early establishes the deploy pipeline.

**Steps:**

1. Inside `puretask/`: `git status` — confirm git is already initialized (Next.js does this).
2. On GitHub.com, create a new **empty private repo** named `puretask`. Do not initialize with README/license/gitignore.
3. Back in your terminal, run the two commands GitHub shows you:
   ```
   git remote add origin git@github.com:<your-username>/puretask.git
   git branch -M main
   ```
4. `git add -A`
5. `git commit -m "chore: initial Next.js 15 scaffold"`
6. `git push -u origin main`
7. Refresh GitHub — your code is there.

**Verify:**

- Repo exists on GitHub.
- Latest commit shows up on `main`.

**Common mistakes:**

- Initializing the GitHub repo with a README first — causes a merge conflict on first push.
- Committing `node_modules/` because you accidentally deleted `.gitignore`. (Next.js's default `.gitignore` is correct; don't touch it.)

---

## Task 3 — Configure TypeScript strict mode

**Goal:** Crank TypeScript strictness up.

**Why:** Strict mode catches null/undefined bugs and missing types at compile time. The defaults are too lax.

**Steps:**

1. Open `tsconfig.json`.
2. Inside `compilerOptions`, ensure these are all `true`:
   ```json
   "strict": true,
   "noUncheckedIndexedAccess": true,
   "noImplicitOverride": true,
   "forceConsistentCasingInFileNames": true
   ```
3. If your `tsconfig.json` doesn't have these, add them.

**Verify:**

- Run `pnpm exec tsc --noEmit` — should pass with no errors.

**Common mistakes:**

- Setting strict to `false` later when you hit your first type error. **Don't.** Fix the type error.
- Adding `// @ts-ignore` or `// @ts-expect-error` to silence things. Use sparingly with a comment explaining why.

---

## Task 4 — Set up the folder structure

**Goal:** Match the structure documented in `AGENTS.md`.

**Why:** Doing this empty, before any real code, means every future file knows where it belongs.

**Steps:**

1. Inside `src/`, create empty directories matching the structure:
   ```
   src/
   ├── app/                   (already exists)
   ├── components/
   │   ├── ui/                (will be filled by shadcn later)
   │   └── shared/
   ├── features/              (empty for now)
   ├── lib/
   │   ├── supabase/
   │   └── utils/
   ├── server/
   ├── types/
   └── styles/                (already exists if Tailwind installed it)
   ```
2. Add a `.gitkeep` file to each empty folder so git tracks them. Just create empty files: `touch src/components/shared/.gitkeep` etc.
3. At repo root, create:
   - `db/migrations/` — for SQL files
   - `docs/` — for documentation
   - `tests/` — for tests later
4. Move the documents you've written into the repo:
   ```
   docs/PureTask_Master_Guide.md
   docs/puretask-decisions.md
   docs/phases/phase-1-spec.md
   AGENTS.md             (at repo root)
   ```

**Verify:**

- `ls src/` shows all expected folders.
- `git status` shows the new structure.

**Common mistakes:**

- Forgetting `.gitkeep` files — empty dirs aren't tracked by git, so the structure disappears for the next clone.
- Putting `AGENTS.md` inside `docs/` instead of at repo root. AI tools look for it at the root.

---

## Task 5 — Add Prettier and refine ESLint

**Goal:** Auto-formatting and stricter linting.

**Why:** Removes style debates from your brain. Catches more issues at lint-time.

**Steps:**

1. Install Prettier and the ESLint integration:
   ```
   pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
   ```
2. Create `.prettierrc.json` at repo root:
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100,
     "tabWidth": 2,
     "arrowParens": "always"
   }
   ```
3. Create `.prettierignore` at repo root:
   ```
   node_modules
   .next
   public
   pnpm-lock.yaml
   ```
4. Update `eslint.config.mjs` (or `.eslintrc.json` depending on what Next.js generated). Add `prettier` to extends so ESLint defers style to Prettier. The exact syntax depends on your generated config — search the Next.js docs for "ESLint Prettier integration" if needed.
5. Add scripts to `package.json`:
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "format": "prettier --write .",
     "format:check": "prettier --check .",
     "typecheck": "tsc --noEmit"
   }
   ```
6. Run `pnpm format` once to format everything.

**Verify:**

- `pnpm lint` passes.
- `pnpm typecheck` passes.
- `pnpm format:check` passes.
- Open a `.tsx` file, save it in your editor, and confirm it auto-formats (you may need to install the Prettier extension for Cursor / VS Code and enable "Format on Save").

**Common mistakes:**

- Skipping `eslint-config-prettier` — leads to ESLint and Prettier fighting over style.
- Forgetting to enable Format on Save — defeats the whole point.

---

## Task 6 — Create `.editorconfig`

**Goal:** Cross-editor consistency.

**Why:** If you ever switch machines or invite a contractor, mismatched indentation kills diffs.

**Steps:**

1. Create `.editorconfig` at repo root:

   ```
   root = true

   [*]
   charset = utf-8
   end_of_line = lf
   indent_style = space
   indent_size = 2
   insert_final_newline = true
   trim_trailing_whitespace = true

   [*.md]
   trim_trailing_whitespace = false
   ```

**Verify:**

- File exists. That's it.

---

## Task 7 — Set up environment variables

**Goal:** Working `.env.local` for dev, committed `.env.example`, validated at startup.

**Why:** Without env validation, missing keys cause cryptic 500s in production. Validating loud and early saves hours.

**Steps:**

1. Get your **Supabase dev project credentials** from the Supabase dashboard → Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (treat as a password)

2. Create `.env.local` at repo root (will be gitignored):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Create `.env.example` (committed):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Confirm `.env.local` is in `.gitignore`. (Next.js's default gitignore covers it.)

5. Install zod: `pnpm add zod`

6. Create `src/lib/env.ts`:

   ```ts
   import { z } from 'zod';

   const envSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
     SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
     NEXT_PUBLIC_SITE_URL: z.string().url(),
   });

   const parsed = envSchema.safeParse({
     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
     SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
     NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
   });

   if (!parsed.success) {
     console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
     throw new Error('Invalid environment variables. See .env.example.');
   }

   export const env = parsed.data;
   ```

**Verify:**

- `pnpm dev` starts cleanly.
- Temporarily comment out one var in `.env.local` and run `pnpm dev` — server should crash with a clear error. Re-add the var.

**Common mistakes:**

- Committing `.env.local` accidentally. Never. Run `git status` before every commit.
- Putting the `service_role` key behind `NEXT_PUBLIC_` prefix. It would leak to every browser. Disaster.

---

## Task 8 — Install and configure Supabase clients

**Goal:** Three Supabase clients ready to use (server, browser, middleware).

**Why:** Server-side and client-side Supabase clients have different cookie-handling needs. Mixing them up causes auth bugs that are very hard to debug.

**Steps:**

1. Install Supabase libraries:

   ```
   pnpm add @supabase/supabase-js @supabase/ssr
   ```

2. Create `src/lib/supabase/server.ts`:

   ```ts
   import { createServerClient } from '@supabase/ssr';
   import { cookies } from 'next/headers';
   import { env } from '@/lib/env';
   import type { Database } from '@/types/database';

   export async function createSupabaseServerClient() {
     const cookieStore = await cookies();

     return createServerClient<Database>(
       env.NEXT_PUBLIC_SUPABASE_URL,
       env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options),
               );
             } catch {
               // Server Components cannot set cookies; ignore.
             }
           },
         },
       },
     );
   }
   ```

3. Create `src/lib/supabase/browser.ts`:

   ```ts
   import { createBrowserClient } from '@supabase/ssr';
   import { env } from '@/lib/env';
   import type { Database } from '@/types/database';

   export function createSupabaseBrowserClient() {
     return createBrowserClient<Database>(
       env.NEXT_PUBLIC_SUPABASE_URL,
       env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
     );
   }
   ```

4. Create `src/lib/supabase/middleware.ts`:

   ```ts
   import { createServerClient } from '@supabase/ssr';
   import { NextResponse, type NextRequest } from 'next/server';
   import { env } from '@/lib/env';
   import type { Database } from '@/types/database';

   export async function updateSession(request: NextRequest) {
     let response = NextResponse.next({ request });

     const supabase = createServerClient<Database>(
       env.NEXT_PUBLIC_SUPABASE_URL,
       env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll();
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
             response = NextResponse.next({ request });
             cookiesToSet.forEach(({ name, value, options }) =>
               response.cookies.set(name, value, options),
             );
           },
         },
       },
     );

     // Refresh session if expired — required for Server Components
     await supabase.auth.getUser();

     return response;
   }
   ```

5. Create `src/types/database.ts` with a placeholder export so things compile:
   ```ts
   // Auto-generated. Run `pnpm gen:db` after schema changes.
   export type Database = {
     public: {
       Tables: Record<string, never>;
       Views: Record<string, never>;
       Functions: Record<string, never>;
       Enums: Record<string, never>;
     };
   };
   ```
   (We'll generate the real types in a later phase. For Phase 1, this placeholder is enough.)

**Verify:**

- `pnpm typecheck` passes.
- The three files exist with no TypeScript errors.

**Common mistakes:**

- Importing the server client into a Client Component — leaks the cookie handler to the browser. Watch for this in error messages.
- Mixing the older `@supabase/auth-helpers-nextjs` package with `@supabase/ssr`. They're incompatible. Use `@supabase/ssr` only — `auth-helpers` is deprecated.

---

## Task 9 — Add a smoke-test page that talks to Supabase

**Goal:** Prove the Supabase connection works end-to-end inside a Server Component.

**Why:** If Supabase is misconfigured, you want to know in Phase 1 — not in Phase 6.

**Steps:**

1. In Supabase dashboard, open the SQL editor and run a quick test table:

   ```sql
   CREATE TABLE public.smoke_test (
     id bigint generated always as identity primary key,
     message text not null,
     created_at timestamptz not null default now()
   );

   INSERT INTO public.smoke_test (message) VALUES ('hello from supabase');

   ALTER TABLE public.smoke_test ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Public read for smoke test" ON public.smoke_test
     FOR SELECT TO anon, authenticated
     USING (true);
   ```

2. In your repo, replace `src/app/page.tsx` with:

   ```tsx
   import { createSupabaseServerClient } from '@/lib/supabase/server';

   export default async function HomePage() {
     const supabase = await createSupabaseServerClient();
     const { data, error } = await supabase.from('smoke_test').select('*').limit(1);

     return (
       <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
         <h1 className="text-3xl font-bold">PureTask</h1>
         <p className="text-muted-foreground">Phase 1 smoke test</p>
         {error ? (
           <pre className="rounded bg-red-50 p-4 text-red-900">Error: {error.message}</pre>
         ) : (
           <pre className="rounded bg-green-50 p-4 text-green-900">
             {JSON.stringify(data, null, 2)}
           </pre>
         )}
       </main>
     );
   }
   ```

3. `pnpm dev` and visit `http://localhost:3000`.
4. You should see the smoke_test row JSON.

**Verify:**

- The page shows your smoke_test row, no error.
- `pnpm typecheck` passes.

**Common mistakes:**

- Forgetting RLS policy — you'll get an empty array. The query "succeeds" but returns nothing.
- Calling `createSupabaseServerClient()` without `await` — common TypeScript gotcha now that `cookies()` is async.

**Cleanup (later):** the `smoke_test` table is throwaway. Drop it once Phase 1 is done.

---

## Task 10 — Set up Vercel and deploy

**Goal:** Production deploy live on the public internet.

**Why:** Proving the deploy pipeline early means you find deploy bugs before you have real code at risk.

**Steps:**

1. Push your latest changes to GitHub:

   ```
   git add -A
   git commit -m "chore: phase 1 foundation"
   git push
   ```

2. On Vercel.com, click **Add New → Project**. Import your `puretask` GitHub repo.

3. Configure project:
   - Framework: Next.js (auto-detected)
   - Root directory: `./`
   - Build command: leave default
   - Output directory: leave default

4. **Add environment variables** in Vercel for the Production environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set to your eventual production URL (e.g., `https://puretask.vercel.app` until you have a real domain)

5. Click **Deploy.**

6. Wait ~2 minutes for the build.

7. Visit the URL Vercel gives you. You should see your home page.

**Verify:**

- Production URL loads.
- Smoke test data shows up there too.

**Common mistakes:**

- Forgetting to add env vars to Vercel — build succeeds, runtime crashes.
- Pasting the `NEXT_PUBLIC_SITE_URL` with `http://localhost:3000` in production. Update it after first deploy.
- Not realizing Vercel automatically deploys on every push to `main`. This is intentional and correct, but be aware: from now on, every push to main is a production deploy.

---

## Task 11 — Verify preview deploys work

**Goal:** Pushes to feature branches create preview URLs.

**Why:** This is your safety net for the rest of the project. You'll be using preview URLs constantly.

**Steps:**

1. Create a feature branch:
   ```
   git checkout -b test/preview-deploy
   ```
2. Make a tiny change — e.g., update the heading in `src/app/page.tsx` to "PureTask — Preview".
3. Commit and push:
   ```
   git add -A
   git commit -m "chore: test preview deploy"
   git push -u origin test/preview-deploy
   ```
4. Open a Pull Request on GitHub from `test/preview-deploy` → `main`.
5. Wait for the Vercel comment on the PR with the preview URL.
6. Click the preview URL — should show "PureTask — Preview" while production still shows "PureTask".

**Verify:**

- Preview URL works.
- Production unchanged.
- Closing the PR without merging is fine — this was just a test.

**Cleanup:**

- Close the PR (don't merge).
- `git checkout main`
- `git branch -D test/preview-deploy`

---

## Task 12 — Add the project documents to the repo

**Goal:** Commit the master guide, decisions catalog, AGENTS.md, and this phase spec.

**Why:** Future-you and AI assistants need these in the project.

**Steps:**

1. Place files:
   ```
   AGENTS.md                                    (repo root)
   docs/PureTask_Master_Guide.md
   docs/puretask-decisions.md
   docs/phases/phase-1-spec.md                  (this file)
   ```
2. Commit:
   ```
   git checkout main
   git add -A
   git commit -m "docs: add master guide, decisions catalog, AGENTS, and phase 1 spec"
   git push
   ```

**Verify:**

- All 4 files visible on GitHub.
- AGENTS.md at repo root, not in `docs/`.

---

## Task 13 — Final Phase 1 self-check

Before you call Phase 1 done, walk through this list. If anything fails, go back and fix.

### Code quality

- [ ] `pnpm dev` runs locally without errors
- [ ] `pnpm build` completes without errors
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm format:check` passes

### Deployment

- [ ] Push to `main` deploys to Vercel automatically
- [ ] Production URL is live and shows your home page
- [ ] Preview deploys work on feature branches

### Configuration

- [ ] `.env.local` has all four required vars and is gitignored
- [ ] `.env.example` is committed with placeholder values
- [ ] Env vars are validated at startup (try removing one to confirm)
- [ ] Vercel env vars set for Production environment

### Database connection

- [ ] Smoke test page reads from Supabase successfully
- [ ] Production deploy can also read the smoke test data

### Project structure

- [ ] `src/app/`, `src/components/`, `src/features/`, `src/lib/`, `src/server/`, `src/types/` all exist
- [ ] `db/migrations/`, `docs/`, `tests/` exist at repo root
- [ ] `AGENTS.md` at repo root
- [ ] `docs/PureTask_Master_Guide.md`, `docs/puretask-decisions.md`, `docs/phases/phase-1-spec.md` exist

### Editor

- [ ] Cursor or VS Code recognizes `@/` alias
- [ ] Format on save works
- [ ] Type errors show in real time

If all checks pass: **Phase 1 is done.** Celebrate, then move to Phase 2 (Authentication) — but write that phase spec first, the same way we wrote this one.

---

# Beginner mistakes to avoid in Phase 1

I'm flagging these specifically because they're easy to make and expensive to fix:

1. **Skipping the smoke test.** "Why bother — I'll add a real query later." Then in Phase 4 you find out your Supabase keys were wrong all along, and you've just wasted weeks.
2. **Treating Phase 1 as "done" with deploy issues.** A flaky deploy in Phase 1 becomes a daily blocker by Phase 4.
3. **Skipping env validation.** "It works in dev." It won't work the first time you forget to set a Vercel env var.
4. **Using `npm install` once "just to see."** Creates `package-lock.json`. Now you have two lockfiles fighting. Delete `package-lock.json` immediately if it appears.
5. **Editing files inside `src/components/ui/`.** When you install shadcn components in later phases, the CLI overwrites those. Edits are lost.
6. **Skipping `.gitkeep` in empty folders.** Folders disappear on git clone.
7. **Hardcoding the production URL in code.** Use `env.NEXT_PUBLIC_SITE_URL` always. Otherwise you forget to change it for prod.
8. **Pushing your `.env.local` to GitHub.** Run `git status` before every commit. If you see `.env.local`, stop. Even if you delete in the next commit, the secret is in git history. You'd need to rotate keys.
9. **Treating Vercel "Preview" environment as a real staging environment.** It's per-branch ephemeral. You don't have a true staging environment yet — and that's fine for Phase 1.
10. **Trying to set up Stripe / Checkr / SMS providers now.** Those are Phase 4+. Don't pre-optimize.

---

# What "I'm stuck" looks like

If you've spent more than 90 minutes on a single task and aren't making progress, escalate:

- Check the Next.js, Supabase, Vercel docs (link them in chat with Cursor or Claude Code).
- Ask the AI: "I'm stuck on Task X of `docs/phases/phase-1-spec.md`. Here's the error: ..."
- If still stuck: ask the founder (you, but with fresh eyes) — sometimes a 10-minute walk fixes it.
- Last resort: post the issue with full context (error message, code, what you've tried) on Stack Overflow or the relevant Discord.

The trap is **silently struggling for hours.** That's how solo founders burn weekends. Move on, get help, don't be precious.

---

# After Phase 1

When Phase 1 is done:

1. **Tag the milestone:** `git tag phase-1-complete && git push --tags`. You can always come back to this point.
2. **Write the dev journal entry:** what worked, what was painful, what you'd do differently. The master guide encourages this discipline; don't skip it.
3. **Write the Phase 2 spec.** Same template as this file. Auth flow, sign-in/sign-up screens, the auth.users → users table sync trigger, basic logged-in shell.

---

**End of Phase 1 spec.**
