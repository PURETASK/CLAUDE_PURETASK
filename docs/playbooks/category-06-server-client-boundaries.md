# Category 6 Playbook: Server vs Client Boundaries

## Build Rules
- Default to Server Components.
- Add `'use client'` only when interactivity is required.
- Use server actions for first-party UI mutations.
- Use route handlers for webhooks/third-party callbacks.
- In Server Components, fetch directly on server.
- In Client Components, use TanStack Query when client fetching is needed.
- Revalidate path/tag after successful mutations.

## Never Do
- Do not fetch core data in `useEffect` by default.
- Do not use API routes for everything.

## Done Checklist
- Client boundaries are explicit and justified.
- Mutation flow uses server actions where expected.
- Cache revalidation is present where mutation affects reads.
