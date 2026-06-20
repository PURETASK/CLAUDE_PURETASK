# B1–B8 SQL — Reference Only (Do Not Apply)

This folder is a **historical / review copy** of the core schema batches. It is **not** the source of truth for the running application.

## Use instead

| Need | Location |
| --- | --- |
| **Apply schema** | `db/migrations/0001_b1_core_identity.sql` through `0008_b8_audit_fixes.sql`, then `0009`–`0016` phase migrations |
| **Handoff notes** | `CLAUDE_CODE_HANDOFF.md` in this folder (context only) |
| **V1 launch** | `docs/v1-launch-scope.md` |

## Why this folder exists

Early schema drafts were reviewed here before being merged into ordered migrations. Filenames here (`B1_core_identity.sql`, etc.) map to `db/migrations/0001_*` … `0008_*` but may **differ** from the shipped versions.

**Never** run these files against staging or production if migrations `0001`–`0016` are already applied — you risk duplicate objects or policy conflicts.

## Action for maintainers

- Treat as **read-only reference** unless doing a deliberate diff against `db/migrations/`.
- Prefer deleting or archiving this folder once the team confirms no unique content remains (diff vs `0001`–`0008`).
