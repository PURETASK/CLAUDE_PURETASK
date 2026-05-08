# Phase 4 Explainer

Phase 4 turns a cleaner-role signup into an approved cleaner profile through a gated pipeline:

1. Application draft and multi-step persistence
2. Identity verification
3. Background check
4. Stripe Connect onboarding
5. Tax + training completion
6. Admin review and decision

## Implementation Sequencing
- 4b first: application + persistence + submit state transition
- 4c/4d/4e: external integrations with verified webhooks
- 4f: admin queue/detail/actions + approval transaction
- 4g: final UX glue (training/tax/review)
- 4h: production verification and closeout evidence

## Non-Negotiables
- Webhook signature verification for every provider webhook
- RLS isolation for applicant-owned data
- Admin actions audit logging
- Approval blocked unless all prerequisites are complete
- End-to-end production verification before phase closeout

## Legal Markers
- FCRA content and adverse-action flow are legally sensitive
- Use `PENDING_LAWYER_REVIEW` markers until counsel confirms final copy
