# Category 4 Playbook: Code Style and Tooling

## Build Rules
- Use ESLint with Next.js + TypeScript rules.
- Use Prettier for formatting.
- Respect `.editorconfig`.
- Sort imports: external -> `@/` alias -> relative.
- Use `@/` alias for `src/` paths.
- Prefer arrow functions for components and utilities.
- Keep comments focused on why, not what.

## Never Do
- Do not manually format against Prettier rules.
- Do not introduce deep relative import chains where alias works.

## Done Checklist
- Lint/format expectations hold for changed files.
- Imports are consistently ordered.
- Comments are minimal and meaningful.
