# Archive Policy

This folder stores historical artifacts that are useful for context but are not part of the active app codepath.

## What goes here

- legacy wireframes and HTML prototypes
- duplicate schema dumps and one-off SQL exports
- screenshots and temporary design captures
- old notes superseded by canonical docs

## What should stay out

- active implementation docs (`docs/phases/*.md`, decisions, guides)
- app/runtime code under `src/`
- migration source-of-truth under `db/migrations/`

## Conventions

- Prefer descriptive subfolders (`wireframes/`, `notes/`, `screenshots/`, `sql-duplicates/`).
- Keep archive files read-only unless there is a strong reason to edit.
- If new artifacts are generated, move them here promptly to keep repo root clean.
