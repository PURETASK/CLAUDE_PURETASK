# Category 9 Playbook: Error Handling and Logging

## Build Rules
- Return server action results as `{ ok: true, data } | { ok: false, error }` for expected failures.
- Use route-level `error.tsx` boundaries where appropriate.
- Map technical errors to user-safe messages.
- Log operational failures (auth/payments/disputes/server errors).

## Never Do
- Do not surface raw stack traces to users.
- Do not log sensitive user or payment data.

## Done Checklist
- Errors are handled without app-wide crashes.
- User-facing messages are clear and non-technical.
- Logs contain enough signal without leaking PII.
