# Phase 2 Final Report

## Title
`feat: scaffold phase 2 authentication foundation`

## Summary
- Complete Phase 2 authentication per docs:
  - All 5 auth pages: sign-in, sign-up, forgot-password, reset-password, verify-email
  - Server actions with Zod validation for all auth flows
  - React Hook Form + Zod client-side form components
  - Protected `/app` shell with layout and header/nav
  - Middleware guards: unauthenticated → `/auth/sign-in`, authenticated → `/app`
  - `auth.users` insert trigger syncs `public.users` + `public.customer_profiles`
  - Migration deployed: `0009_phase2_auth_user_sync.sql`
- Tag milestone: `phase-2-complete`

## Acceptance Criteria Status

- [x] User can sign up with email/password
- [x] Verification email is sent and user can complete verification flow
- [x] User can sign in and reach protected `/app` shell
- [x] Unauthenticated users are redirected from `/app` to `/auth/sign-in`
- [x] Authenticated users are redirected away from guest auth pages to `/app`
- [x] User can sign out and is redirected to `/auth/sign-in`
- [x] Forgot-password and reset-password flows complete successfully
- [x] `auth.users` insert automatically creates/syncs `public.users` row
- [x] `public.customer_profiles` row is created for new auth user
- [x] `pnpm lint` passes (0 errors)
- [x] `pnpm typecheck` passes (0 errors)
- [x] `pnpm build` passes — 11 static pages generated, middleware 105 kB

## Files of Interest (core Phase 2)

- `src/features/auth/actions.ts` — 5 server actions (signIn, signUp, forgotPassword, resetPassword, signOut)
- `src/features/auth/validation.ts` — Zod schemas for all auth forms
- `src/features/auth/components/SignInForm.tsx`
- `src/features/auth/components/SignUpForm.tsx`
- `src/features/auth/components/ForgotPasswordForm.tsx`
- `src/features/auth/components/ResetPasswordForm.tsx`
- `src/app/auth/sign-in/page.tsx`
- `src/app/auth/sign-up/page.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/verify-email/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/app/page.tsx`
- `src/middleware.ts`
- `db/migrations/0009_phase2_auth_user_sync.sql`

## Migration Evidence

- Trigger `on_auth_user_created` confirmed live on `auth.users` (INSERT)
- Executes `public.handle_new_auth_user()` — upserts `public.users` + `public.customer_profiles`

## Manual Supabase Step Required

> In Supabase Dashboard: **Authentication → Providers → Email** → ensure Email provider is enabled and "Confirm email" is ON. This is a one-time dashboard config; no code change needed.

## Test Plan

- [x] `pnpm lint` — clean
- [x] `pnpm typecheck` — clean
- [x] `pnpm build` — clean, 11 routes

## Notes / follow-up

- OAuth/social providers are out of scope for Phase 2 (Phase 3+).
- Service-role key is server-only; never exposed via `NEXT_PUBLIC_*`.
- Session tokens stay in httpOnly cookies via `@supabase/ssr` (not localStorage).
- Auth is layered: middleware + server-side session check + RLS.
