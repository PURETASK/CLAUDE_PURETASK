# Category 14 Playbook: Testing Strategy

## Build Rules
- Prioritize tests for high-risk business logic first.
- Use Vitest for unit tests when test phase begins.
- Use Playwright for E2E before launch-critical flows.
- Add tests incrementally by phase and risk.

## Never Do
- Do not spend early-phase time on low-value snapshot churn.
- Do not ship launch-critical money/auth flows untested.

## Done Checklist
- Critical logic has at least basic deterministic coverage.
- Core user journeys are represented in E2E plan.
- Test scope matches current phase commitments.
