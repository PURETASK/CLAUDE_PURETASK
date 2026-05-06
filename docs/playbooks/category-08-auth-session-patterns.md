# Category 8 Playbook: Auth and Session Patterns

## Build Rules
- Use Supabase Auth.
- Keep sessions in secure cookies, not localStorage.
- Enforce route protection in `src/middleware.ts`.
- Layer auth with DB RLS and server checks.
- Implement sign-out as a server action.

## Never Do
- Do not rely on client-side role checks only.
- Do not bypass middleware for protected route groups.

## Done Checklist
- Protected routes redirect correctly for anonymous users.
- Auth routes redirect correctly for signed-in users.
- Sign-out clears session and navigates predictably.
