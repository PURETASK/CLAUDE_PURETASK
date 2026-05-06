# Category 1 Playbook: Framework, Language, Runtime

## Build Rules
- Use Next.js App Router.
- Use TypeScript with strict mode.
- Use Node 20 LTS or 22 LTS.
- Use `pnpm` only.
- Use ES module syntax (`import`/`export`) only.

## Never Do
- Do not use `npm`/`yarn` in this repo.
- Do not downgrade to non-LTS Node versions.
- Do not copy CommonJS `require()` snippets into app code.

## Done Checklist
- `package.json` has stable scripts and `pnpm` workflow.
- Local and CI/runtime Node versions are compatible.
- No mixed lockfile/package manager artifacts are introduced.
