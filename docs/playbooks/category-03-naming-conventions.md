# Category 3 Playbook: Naming Conventions

## Build Rules
- Component files: PascalCase (`BookingCard.tsx`).
- Other files: kebab-case (`format-currency.ts`).
- Folders: kebab-case (`cleaner-profile/`).
- Hooks: camelCase with `use` prefix (`useCurrentUser`).
- Server actions: verb-first + `Action` suffix (`createBookingAction`).
- DB columns: snake_case.
- Constants: SCREAMING_SNAKE_CASE.
- Types: PascalCase, no `I` prefix.
- Booleans: `is`/`has`/`can`/`should` prefix.
- Named exports by default (except Next.js required defaults).

## Never Do
- Do not invent new naming styles per file.
- Do not use vague symbols like `data`, `item`, `thing` in shared code.

## Done Checklist
- New files and symbols match conventions.
- Action names are greppable and explicit.
- Export style is consistent.
