# Category 7 Playbook: Forms and Validation

## Build Rules
- Use `react-hook-form` for forms.
- Use `zod` schemas for validation.
- Keep per-feature schemas in `src/features/<feature>/validation.ts`.
- Reuse the same schema on client and server action.
- Show inline field errors and form-level errors clearly.

## Never Do
- Do not trust client-only validation.
- Do not duplicate validation logic in disconnected places.

## Done Checklist
- Schema exists and is shared across form + action.
- Invalid inputs produce user-friendly messages.
- Error UX is consistent (field, form, and system levels).
