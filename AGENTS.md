# Fulscann-DB Agent Instructions

- Preserve the role boundary: Analysts provide oversight, review, support, and escalation only.
- Keep CEO ownership over business data, approvals, exception resolution, and external report sharing.
- Keep business logic out of React components.
- Put scoring logic in `lib/scoring`.
- Put internal control checks in `lib/ic-engine`.
- Put analyst assignment, workload, and readiness logic in `lib/analyst`.
- Add tests for scoring, control checks, and permission-sensitive behavior.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
