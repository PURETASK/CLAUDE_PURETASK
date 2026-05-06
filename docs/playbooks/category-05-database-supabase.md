# Category 5 Playbook: Database and Supabase

## Build Rules
- Treat `db/migrations/*.sql` as schema source of truth.
- Regenerate and commit DB types after schema changes.
- Keep RLS on for all user-data tables.
- Use runtime-specific Supabase clients (server/browser/middleware).
- Put complex SQL in DB functions/RPC where appropriate.
- Use deterministic seed data in `db/seed.sql`.

## Never Do
- Do not ship schema-only changes from Supabase Studio.
- Do not skip RLS policies during table creation.
- Do not use the wrong Supabase client for runtime context.

## Done Checklist
- Migration file(s) added with correct ordering.
- RLS and policies included for affected tables.
- `src/types/database.ts` refreshed when needed.
- App code references correct Supabase clients.
