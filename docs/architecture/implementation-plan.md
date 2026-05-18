# Fulscann-DB Implementation Plan

## Current Build Slice

The first implementation slice establishes the operating model:

1. Fulscann Super Admin reviews platform coverage and assigns businesses to analysts.
2. Fulscann Analyst monitors assigned businesses, up to 15 active assignments.
3. Analyst identifies readiness issues, weak evidence, score decline, inactivity, and high-risk exceptions.
4. CEO retains ownership of business data, approvals, exception resolution, and report sharing.
5. Institution users see approved interpreted report data only.

## Implementation Boundaries

- Analyst access is assignment-based.
- Analyst notes do not overwrite business-owned records.
- Analyst escalation is audited and routed to Super Admin.
- CEO-sensitive actions cannot be approved by Analysts.
- Integrity Report sharing remains CEO-controlled.

## Next Engineering Steps

1. Connect Supabase Auth and map auth users to `profiles`.
2. Apply the foundation migration.
3. Add RLS policies for Super Admin, Analyst, CEO, Staff, and Institution access.
4. Replace sample data with server queries.
5. Implement analyst assignment mutations with audit events.
6. Add department reporting forms and evidence upload.

## Implemented Assignment Flow

Super Admins can assign unassigned businesses to Analysts from `/dashboard/super-admin`.

The flow:

1. Requires `super_admin` route access.
2. Lists only unassigned businesses.
3. Lists only Analysts below the 15-business limit.
4. Inserts `analyst_assignments`.
5. Writes an `audit_events` row.
6. Revalidates Super Admin and Analyst dashboards.

The database still enforces the final boundary through `trg_enforce_analyst_assignment_rules`.

## Implemented Analyst Action Flow

Analysts can act from `/dashboard/analyst` on actively assigned businesses.

Implemented actions:

1. Add internal note.
2. Request clarification from the business.
3. Mark submitted department report as review-ready.
4. Escalate Orange/Red issues to Super Admin.

Boundaries:

- Analyst actions require the `analyst` role.
- Notes and escalations are scoped to assigned businesses by RLS.
- Clarification requests are business-visible notes.
- Report review-ready updates are limited by app logic and RLS to assigned businesses.
- Analysts still cannot approve sensitive CEO actions, edit business-owned data, delete records, or share Integrity Reports.

## Implemented CEO Response Flow

CEOs can act from `/dashboard/ceo`.

Implemented actions:

1. Respond to Analyst clarification requests.
2. Resolve open control exceptions with a resolution note.
3. Share Integrity Report access with an institution.
4. Revoke active institution report access.

Boundaries:

- CEO responses are stored in `ceo_responses`.
- Exception resolution updates `control_exceptions` and writes an audit event.
- Institution access grants are stored in `institution_access`.
- Integrity Report sharing remains CEO-owned.
- Analysts can review readiness but cannot grant or revoke institution access.

## Implemented CEO Onboarding Flow

CEOs can continue onboarding from `/dashboard/ceo/onboarding`.

Implemented actions:

1. Create business profile.
2. Submit five-category structural assessment.
3. Calculate and store VeriScore v1.0.
4. Create KPI targets.
5. Create initial departments.

Boundaries:

- Onboarding writes require the `business_user` role.
- Assessment responses and VeriScore results are business-scoped.
- KPIs and departments remain CEO/business-owned data.
- Analysts can review readiness but cannot create or mutate onboarding records.

## Implemented Staff Invitation And Reporting Flow

CEOs can invite staff from `/dashboard/ceo/staff`.

Staff can submit reports from `/dashboard/staff`.

Implemented actions:

1. CEO invites staff into a department.
2. Staff submits department report value and evidence count.
3. Report is stored as `submitted`.
4. Audit event is written for invitation and report submission.

Boundaries:

- Staff users remain `business_user` at the platform level.
- Department responsibility is business-scoped through invitations and membership data.
- CEOs own staff invitations.
- Staff can submit operating reports but cannot share Integrity Reports or approve CEO-sensitive actions.

## Implemented IC Automation Slice

The first automated IC check runs after staff submits Sales or Finance reports.

Implemented behavior:

1. Find latest Sales and Finance reports for the business.
2. Run sales-finance match check.
3. Create a `control_exceptions` row for a new mismatch.
4. Insert an `ic_scores` history row.
5. Update the business current/previous IC Score.
6. Write audit events for exception creation and score recalculation.

Boundaries:

- Automation does not accuse fraud.
- The exception language remains `Sales-finance mismatch`.
- Duplicate open mismatch exceptions are not created.
- CEO remains responsible for exception resolution.

## Implemented Evidence Metadata Slice

Staff can attach evidence files to department reports from `/dashboard/staff`.

Implemented behavior:

1. Evidence files are uploaded to the private `evidence-files` Supabase Storage bucket.
2. Evidence records are stored in `evidence_files`.
3. Evidence is linked to a department report and business.
4. Evidence storage paths are business/report-scoped.
5. Dashboard links use short-lived signed URLs.
6. Evidence levels follow the product model: 0 claim only, 1 basic, 2 verified, 3 cross-verified.
7. Report evidence count is updated from attached evidence records.
8. Evidence attachment is audited.
9. Sales/Finance evidence attachment can trigger IC recalculation.

Boundaries:

- The bucket is private.
- Storage object policies use the business ID path segment for business-member and assigned-Analyst access.
- Analysts can review evidence links but cannot mutate business-owned evidence.
- Signed URLs are generated server-side and expire.

Previous metadata-only behavior has been replaced with private file upload plus metadata.
