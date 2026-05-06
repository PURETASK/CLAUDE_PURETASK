# Phase 2 � Authentication Spec

> **Goal:** A customer can sign up, verify email, sign in, sign out, and access a protected app shell.
> **Estimated time:** 1�2 weeks.
> **Prerequisite:** Phase 1 complete (deploy + env + Supabase smoke test verified).

---

## Acceptance criteria � Phase 2 is "done" when:

- [ ] User can sign up with email/password
- [ ] Verification email is sent and user can complete verification flow
- [ ] User can sign in and reach protected `/app` shell
- [ ] Unauthenticated users are redirected from `/app` to `/auth/sign-in`
- [ ] Authenticated users are redirected away from guest auth pages to `/app`
- [ ] User can sign out and is redirected to `/auth/sign-in`
- [ ] Forgot-password and reset-password flows complete successfully
- [ ] `auth.users` insert automatically creates/syncs `public.users` row
- [ ] `public.customer_profiles` row is created for new auth user
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass
- [ ] Production deploy succeeds with no auth regression

---

## Scope (this phase only)

In scope:

- Supabase Auth email/password flows
- Auth route UI and server actions
- Protected shell route scaffolding
- Middleware redirects for auth guardrails
- `auth.users` sync trigger migration

Out of scope:

- OAuth/social providers
- Magic link auth
- Role-specific dashboards beyond basic shell
- Cleaner/admin onboarding and permissions UX

---

## Implementation tasks

## Task 1 � Auth pages and forms

Create pages:

- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`

Use `react-hook-form` + `zod` validation schemas in `src/features/auth/validation.ts`.

## Task 2 � Server actions

Create auth actions in `src/features/auth/actions.ts`:

- `signInAction`
- `signUpAction`
- `forgotPasswordAction`
- `resetPasswordAction`
- `signOutAction`

Pattern: return `{ ok: true, data/message } | { ok: false, error }`.

## Task 3 � Protected shell

Create an authenticated shell under `/app`:

- basic layout/header/nav
- server-action sign-out control

## Task 4 � Middleware guards

In `src/middleware.ts`:

- Redirect unauthenticated users from protected routes (`/app/*`) to sign-in
- Redirect authenticated users away from auth guest routes

## Task 5 � DB user sync trigger

Add migration to sync Supabase auth users:

- trigger on `auth.users` insert
- upsert `public.users`
- ensure `public.customer_profiles` exists for new users

Migration path:

- `db/migrations/0009_phase2_auth_user_sync.sql`

## Task 6 � Verify flows

Local checks:

- sign up / verify / sign in / sign out
- forgot/reset password
- middleware redirects

Quality checks:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Deploy checks:

- production deploy passes
- preview deploy passes

---

## Risks and notes

- Keep service-role keys server-only. Never expose in `NEXT_PUBLIC_*`.
- Do not use `@supabase/auth-helpers-nextjs` (deprecated); use `@supabase/ssr` only.
- Session tokens must stay in httpOnly cookies (never localStorage).
- Keep auth logic layered: middleware + server-side checks + RLS.

---

## Definition of done

Phase 2 is complete only when all acceptance criteria above are checked and validated in both local and deployed environments.
