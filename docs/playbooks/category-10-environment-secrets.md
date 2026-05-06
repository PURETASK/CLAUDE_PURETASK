# Category 10 Playbook: Environment and Secrets

## Build Rules
- Keep local secrets in `.env.local` only.
- Keep variable names and placeholders in `.env.example`.
- Store production secrets in Vercel env settings.
- Use `NEXT_PUBLIC_` only for browser-safe values.
- Validate required env vars at boot in `src/lib/env.ts`.

## Never Do
- Do not commit real secrets.
- Do not expose secret values through `NEXT_PUBLIC_*`.

## Done Checklist
- `.env.example` reflects any new variables.
- Env validation catches missing/invalid vars early.
- Vercel Production/Preview vars are updated when needed.
