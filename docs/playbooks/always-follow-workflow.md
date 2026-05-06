# Always-Follow Workflow

Purpose: make standards compliance automatic for every code change.

## Step 0: Pick the relevant playbooks
- Start from `docs/playbooks/README.md`.
- Select category playbooks for the task.
- Keep `docs/puretask-build-playbook.md` open while coding.

## Step 1: Run a kickoff pass before writing code
- Copy `docs/playbooks/feature-kickoff-template.md`.
- Fill sections 1-5 before editing files.
- If DB/auth/env changes are involved, complete sections 6-8 as well.

## Step 2: Build with guardrails
- Follow naming and folder conventions while creating files.
- Keep page routes thin and logic in feature folders.
- Use server actions for first-party mutations.
- Validate inputs with zod on both client/server paths.

## Step 3: Self-review before PR
- Walk through relevant category "Done Checklist" sections.
- Run:
  - `pnpm lint`
  - `pnpm typecheck`
- Fix newly introduced issues before PR.

## Step 4: Open PR with required checklist
- Fill `.github/pull_request_template.md` fully.
- Confirm decisions compliance checklist items are all checked.
- Include risks/follow-ups explicitly if any checkbox cannot be completed.

## Step 5: Keep docs in sync
- If a convention changes:
  - update `docs/puretask-decisions.md`
  - update `docs/puretask-build-playbook.md`
  - update the affected file in `docs/playbooks/`
  - update `AGENTS.md` if coding behavior changes

## Enforced Team Rule
- No merge to `main` unless:
  - PR template checklist is complete
  - lint and typecheck pass
  - relevant playbook checklists were reviewed
