# Wireframes & Specs — Reference Only (Do Not Build Blindly)

This tree holds **design review artifacts** (HTML wireframes, deep-dive markdown, phase 8 specs) that are **not** automatically synced with the Next.js app.

## Use instead

| Need | Location |
| --- | --- |
| **What is implemented** | `docs/puretask-implementation-overview.md` |
| **V1 scope (what to build now)** | `docs/v1-launch-scope.md` |
| **Post-v1 UI work** | `docs/v1-post-launch-backlog.md` (DES-01 wireframe parity) |
| **Product spec** | `docs/PureTask_Master_Guide.md` |

## Subfolders

| Folder | Contents |
| --- | --- |
| `wireframes_clean/` | HTML wireframe batches (WF001+) |
| `wireframes_puretask/` | Deep-dive markdown, phase 8b/8c specs, zip archive |

## Rules for engineers and agents

1. **Do not** treat HTML wireframes as runnable code — implement in `src/app/` + `src/features/` per `AGENTS.md`.
2. For V1, only build screens listed in `docs/v1-launch-scope.md` unless the founder expands scope.
3. When a wireframe conflicts with `db/migrations/`, **migrations win**.
4. Index files (`wireframes_INDEX.md`) help find WF IDs; map to routes manually or via DES-01 backlog item.

## Action for maintainers

- Commit intentional updates here, or move finalized specs into `docs/phases/`.
- Avoid duplicating the same wireframe batch in both `wireframes_clean/` and `wireframes_puretask/` long term.
