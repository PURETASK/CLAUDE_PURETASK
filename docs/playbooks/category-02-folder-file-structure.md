# Category 2 Playbook: Folder and File Structure

## Build Rules
- Keep application code under `src/`.
- Keep pages thin in `src/app/`.
- Put feature logic in `src/features/<feature>/`.
- Put shared reusable UI in `src/components/shared/`.
- Keep DB migrations in `db/migrations/`.
- Keep docs in `docs/` and phase docs in `docs/phases/`.

## Never Do
- Do not put business logic directly in page files.
- Do not scatter one feature across random top-level folders.

## Done Checklist
- New files are placed in the canonical folders.
- New feature has clear boundaries in `src/features/<feature>/`.
- Route files mostly compose existing feature modules.
