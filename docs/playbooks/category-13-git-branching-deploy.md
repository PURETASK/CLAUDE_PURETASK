# Category 13 Playbook: Git, Branching, Deploy

## Build Rules
- Use GitHub feature branches for work.
- Keep `main` always deployable.
- Open PRs before merging to `main`.
- Use concise conventional commit prefixes where possible.
- Use Vercel preview deploys for branch validation.

## Never Do
- Do not push risky unreviewed changes directly to `main`.
- Do not keep long-lived feature branches drifting from `main`.

## Done Checklist
- Branch has focused scope and clear commit history.
- PR includes test/verification notes.
- Preview deploy was validated before merge.
