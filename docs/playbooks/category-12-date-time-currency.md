# Category 12 Playbook: Date, Time, Currency

## Build Rules
- Use `date-fns` for date logic.
- Store timestamps as UTC in DB (`timestamptz`).
- Render user-facing times in intended local timezone rules.
- Store all money as integer cents.
- Format currency via `Intl.NumberFormat` for USD.

## Never Do
- Do not store money as float/double.
- Do not persist local-time timestamps in DB.

## Done Checklist
- New money fields are integer cents in schema/types.
- Date displays are timezone-aware and user-safe.
- Arithmetic on money/time avoids precision pitfalls.
