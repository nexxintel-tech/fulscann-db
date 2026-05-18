# Fulscann-DB Development README

## Local Development

Fulscann-DB is implemented as a Next.js TypeScript application.

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run test
```

Environment variables are documented in `.env.example`.

Auth and RLS details are documented in `docs/architecture/auth-and-rls.md`.

Current implementation slice:

```text
Super Admin dashboard
Analyst dashboard with 15-business workload boundary
CEO dashboard
Institution approved-report view
Analyst workload/readiness logic
VeriScore, IC Score, and IC check functions
Foundation database migration
```

## Project Summary

Fulscann-DB is a control intelligence and SME trust infrastructure platform.

It helps businesses become more structured, fundable, compliant, and operationally trustworthy by combining:

- Business structural assessment
- VeriScore maturity scoring
- CEO KPI setup
- Department reporting
- Smart form suggestions
- Evidence upload
- Internal Control checks
- Exception detection and resolution
- IC Score
- Integrity Reports
- Institution dashboards

The platform should not feel like an audit burden. It should feel like a business improvement and trust-readiness assistant.

---

## Core Product Logic

Fulscann-DB turns SME activity into structured trust intelligence.

```text
Business Profile
  +
Assessment
  +
CEO KPIs
  +
Department Reports
  +
Evidence
  +
Internal Control Checks
  +
Exceptions
  +
Scores
  +
Reports
  =
Trust, Risk, Readiness, and Ranking Intelligence
```

---

## Recommended Development Infrastructure

### Frontend

Use:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod validation
- Recharts for dashboards
- TanStack Query where client-side data fetching/caching is needed

Reason:

Fulscann-DB needs dashboards, forms, reports, institution views, and role-based interfaces. Next.js gives a strong structure for a full product UI while keeping API routes/server actions available where appropriate.

---

### Backend

Recommended backend approach for V2:

- Next.js server routes / server actions for application workflows
- Supabase Postgres for database
- Supabase Auth for authentication
- Supabase Storage for uploaded evidence files
- Supabase Row Level Security for tenant and role isolation
- Supabase Edge Functions only where external-facing server-side workflows are better isolated

Use server-side code for:

- Score recalculation
- IC rule execution
- Exception creation
- Report generation
- Institution report access
- Evidence verification logic
- Email parsing workflows
- Sensitive permission checks

---

### Database

Use:

- Supabase Postgres
- SQL migrations
- Strong relational schema
- Row Level Security enabled on exposed tables
- Audit logs for sensitive actions
- UUID primary keys
- `created_at`, `updated_at`, and `created_by` fields across core tables

Do not rely only on frontend permissions. Business-level, role-level, and institution-level access must be enforced at the database/API level.

---

### Deployment

Recommended setup:

- Vercel for frontend and Next.js app deployment
- Supabase for database, auth, storage, and edge functions
- GitHub for source control
- Codex for task execution, refactoring, testing, and implementation support

Environment separation:

```text
local
staging
production
```

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
APP_ENV=
NEXT_PUBLIC_APP_URL=
```

Rules:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Use service role only in server-only code.
- Keep production and staging projects separate.
- Do not run destructive migrations directly on production without review.

---

## Suggested Repository Structure

```text
fulscann-db/
  app/
    (auth)/
      login/
      signup/
    (marketing)/
      page.tsx
    dashboard/
      super-admin/
      analyst/
      ceo/
      staff/
      institution/
      enterprise/
    businesses/
    assessments/
    departments/
    reports/
    exceptions/
    integrity-reports/
    api/

  components/
    ui/
    forms/
    dashboard/
    reports/
    suggestions/
    evidence/
    exceptions/
    analyst/

  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
    auth/
      guards.ts
      roles.ts
    analyst/
      assignments.ts
      workload.ts
      escalations.ts
    scoring/
      veriscore.ts
      ic-score.ts
      department-score.ts
    ic-engine/
      rules.ts
      checks.ts
      exceptions.ts
      risk-levels.ts
    suggestions/
      field-suggestions.ts
      evidence-suggestions.ts
      record-matching.ts
    reports/
      integrity-report.ts
      ic-report.ts
    utils/
      dates.ts
      currency.ts
      validation.ts

  db/
    migrations/
    seed/
    schema-notes.md

  docs/
    product/
    architecture/
    data-model/
    api/
    controls/
    testing/

  tests/
    unit/
    integration/
    e2e/

  README.md
```

---

## Core Roles

Fulscann-DB must support role-based access from the beginning.

### Business Roles

```text
CEO / Owner
Finance Officer
Sales Officer
Procurement Officer
Operations Officer
Inventory Officer
HR / Admin Officer
IC Reviewer
```

### External Roles

```text
Institution Viewer
Enterprise Viewer
Fulscann Super Admin
Fulscann Analyst
```

### Fulscann Internal Role Hierarchy

```text
Fulscann Super Admin
  |
  v
Fulscann Analyst
  |
  v
Assigned Businesses, up to 15
```

The Analyst oversees assigned businesses and helps ensure their records are clean, complete, and report-ready.

Analysts monitor:

- Business onboarding progress
- Assessment completion
- KPI setup
- Department reporting activity
- Evidence quality
- Open exceptions
- IC Score movement
- VeriScore movement
- Integrity Report readiness
- Businesses needing intervention

Very important boundary:

```text
The Analyst does not control the business.
The Analyst does not replace the CEO.
The Analyst provides oversight, review, support, and escalation.
```

The CEO still owns business data, approvals, staff, sensitive actions, exception resolution, and final Integrity Report sharing.

### Best Role Hierarchy

```text
Fulscann Super Admin
  |
  |-- Manages analysts
  |-- Views platform-wide performance
  |-- Assigns businesses to analysts
  |-- Reviews analyst workload
  |-- Handles escalated issues
  |
Fulscann Analyst
  |
  |-- Oversees up to 15 businesses
  |-- Reviews exceptions
  |-- Checks report readiness
  |-- Flags weak evidence
  |-- Supports businesses through onboarding
  |-- Escalates high-risk issues
  |
Business CEO
  |
  |-- Owns business profile
  |-- Sets KPIs
  |-- Creates departments
  |-- Invites staff
  |-- Approves sensitive items
  |-- Resolves exceptions
  |-- Shares Integrity Report
```

### Analyst Permissions

| Permission | Access |
| --- | --- |
| View assigned businesses | Yes |
| View business dashboard | Yes |
| View reports and evidence | Yes, controlled |
| View exceptions | Yes |
| Comment on exceptions | Yes |
| Request clarification | Yes |
| Mark report as review-ready | Yes |
| Escalate to Super Admin | Yes |
| Edit business data | No, except admin notes |
| Approve CEO-sensitive actions | No |
| Share Integrity Report externally | No |
| Delete business records | No |

### Access Principle

```text
Staff see only assigned department data.
CEO sees the whole business.
Analysts see only businesses assigned to them.
Analysts can review, comment, request clarification, and escalate, but cannot own CEO decisions.
Institution users see only approved reports.
Fulscann Super Admins do not casually access private business data unless operationally required.
```

---

## Main User Flows

### CEO Flow

```text
Signup
  |
Create business profile
  |
Complete assessment
  |
Receive VeriScore
  |
Set Key Performance Indicators
  |
Create departments
  |
Invite staff
  |
Review reports
  |
Approve sensitive items
  |
Resolve exceptions
  |
View IC Score
  |
Share Integrity Report
```

---

### Staff Flow

```text
Login
  |
Open assigned department
  |
Fill assigned form
  |
Use smart suggestions/autocomplete
  |
Upload required evidence
  |
Submit report
  |
Respond to correction requests
  |
Track department status
```

---

### Institution Flow

```text
Login
  |
View approved businesses
  |
Open business trust profile
  |
Review VeriScore
  |
Review IC Score
  |
Review risk flags
  |
Open Integrity Report
  |
Use report for decision support
```

---

## Suggestion Engine

The Suggestion Engine is not a strategic recommendation module in V2.

It is a smart form-assistance layer.

Its purpose is to reduce data-entry friction and improve data quality while users are filling forms.

### What It Should Do

When users fill forms, the system should suggest or autocomplete applicable fields using:

- Business profile data
- Previous submissions
- Department history
- Prior customers
- Prior suppliers
- Prior staff records
- Existing products/services
- CEO-set KPIs
- Linked finance/sales/procurement/inventory records
- Required evidence rules
- Common patterns from the business

### Examples

Sales form:

```text
User types: Ada...
System suggests: Ada Stores Ltd
System may also suggest: last product sold, last invoice format, required evidence
```

Finance form:

```text
User enters: ₦1,200,000 inflow
System suggests: possible match with sales report, unpaid balance, classification options
```

Procurement form:

```text
User selects supplier
System suggests: previous item, usual price range, required evidence, approval requirement
```

Operations form:

```text
User enters production target
System suggests: expected input quantity, typical wastage range, required production evidence
```

### V2 Suggestion Scope

Build only these first:

1. Autocomplete known customers, suppliers, products, staff, departments
2. Suggest previous values where relevant
3. Suggest required evidence before submission
4. Suggest related records that may match
5. Warn about missing or inconsistent fields before submission

---

## Internal Control Engine

The IC Engine validates business activity.

It should check:

```text
Completeness
Evidence
Approval
Cross-department consistency
Patterns/anomalies
Risk level
Exception status
Score impact
```

### IC Flow

```text
User submits report
  |
System checks required fields
  |
System checks required evidence
  |
System checks approval rules
  |
System checks related department records
  |
System detects mismatches or anomalies
  |
System assigns risk level
  |
System creates exception if needed
  |
System updates score
```

---

## Evidence Levels

Use evidence confidence levels.

```text
Level 0 = Claim only
Level 1 = Basic evidence
Level 2 = Verified evidence
Level 3 = Cross-verified evidence
```

Example:

```text
Sales claim only = Level 0
Sales invoice = Level 1
Sales invoice + bank inflow = Level 2
Sales invoice + bank inflow + inventory/delivery evidence = Level 3
```

---

## Risk Levels

Use clear non-accusatory risk language.

```text
Green  = Controlled
Yellow = Weak but manageable
Orange = High concern
Red    = Critical control issue
```

Avoid calling something fraud unless formally confirmed.

Use safer product language:

```text
Potential anomaly
Mismatch
Evidence gap
Requires review
Control weakness
Unresolved exception
```

---

## Key Department Controls

### Sales

Controls:

- Invoice completeness
- Customer traceability
- Payment status
- Sales-to-finance match
- Sales-to-inventory match
- Delivery evidence

Important KPI:

```text
Sales-to-Finance Match Rate
Sales-to-Inventory Match Rate
```

---

### Finance

Controls:

- Inflow evidence
- Outflow evidence
- Expense approval
- Bank reconciliation
- Unexplained transactions
- Cashflow consistency

Important KPI:

```text
Bank Reconciliation Rate
Expense Evidence Rate
Cashflow Health Ratio
```

---

### Procurement

Controls:

- Supplier documentation
- Purchase request
- Approval
- Invoice/receipt evidence
- Delivery confirmation
- Payment-to-delivery match

Important KPI:

```text
Payment-to-Delivery Confirmation Rate
Supplier Documentation Rate
```

---

### Operations / Production

Controls:

- Output completion
- Input usage
- Wastage/loss
- Work-in-progress
- Inventory movement
- Production evidence

Important KPIs:

```text
Wastage / Loss Rate
Output Completion Rate
Production Efficiency
```

Control equation:

```text
Total Input = Completed Output + Work in Progress + Wastage/Loss + Remaining Stock
```

---

### HR / Admin

Controls:

- Staff records
- Role clarity
- Payroll match
- Attendance
- Payroll approval
- Staff changes

Important KPI:

```text
Payroll-to-Staff Match Rate
Role Clarity Rate
```

---

## Updated Sales Control Example

```text
Sales officer reports ₦2,000,000 monthly sales
  |
Uploads invoices
  |
System checks sales form completeness
  |
System checks invoice evidence and inventory evidence
  |
System waits for finance inflow confirmation
  |
Finance reports ₦1,200,000 inflow
  |
IC Engine detects ₦800,000 mismatch
  |
Exception created: Sales-Finance mismatch
  |
Risk level: Orange
  |
Assigned to Sales + Finance
  |
CEO notified
  |
Evidence requested
  |
Resolution submitted
  |
IC Score adjusted
```

---

## Scoring System

Fulscann-DB should support multiple scores.

```text
VeriScore
IC Score
Department Score
Evidence Confidence Score
Reporting Discipline Score
Risk Score
Credit Readiness Signal
```

### IC Score Components

```text
Evidence completeness
Cross-department consistency
Approval discipline
Financial alignment
Reporting timeliness
Fraud/anomaly risk
Issue resolution behavior
```

Suggested weights:

```text
Evidence completeness: 15%
Cross-department consistency: 20%
Approval discipline: 15%
Financial alignment: 20%
Reporting timeliness: 10%
Anomaly risk: 15%
Resolution behavior: 5%
```

---

## Core Database Tables

Start with these tables.

```text
businesses
users
business_users
analyst_assignments
analyst_notes
analyst_escalations
departments
roles
permissions

assessments
assessment_responses
veriscore_results

kpis
kpi_targets
kpi_results

department_reports
sales_records
finance_records
procurement_records
operations_records
inventory_records
hr_records

customers
suppliers
products_services
staff_records

evidence_files
evidence_requirements
evidence_links

control_rules
control_checks
control_exceptions
exception_resolutions

approval_requests
approval_actions

ic_scores
department_scores
risk_signals
suggestion_events

integrity_reports
institution_access

audit_events
```

---

## Important Table Notes

### businesses

```text
id
legal_name
trading_name
sector
location
registration_status
owner_user_id
current_veriscore
current_ic_score
risk_level
created_at
updated_at
```

### business_users

```text
id
business_id
user_id
role
department_id
status
created_at
```

### analyst_assignments

```text
id
analyst_user_id
business_id
assigned_by
status
assigned_at
unassigned_at
created_at
updated_at
```

Rules:

```text
An active analyst should oversee no more than 15 active businesses.
Only a Fulscann Super Admin can assign or unassign analysts.
Analyst access must be limited to actively assigned businesses.
```

### analyst_notes

```text
id
business_id
analyst_user_id
note_type
body
visibility
created_at
updated_at
```

Analyst notes are internal operational notes. They must not overwrite business-owned records.

### analyst_escalations

```text
id
business_id
analyst_user_id
escalated_to
risk_level
reason
status
created_at
resolved_at
```

### department_reports

```text
id
business_id
department_id
submitted_by
period_start
period_end
report_type
status
submitted_at
created_at
updated_at
```

### evidence_files

```text
id
business_id
uploaded_by
file_url
file_name
file_type
linked_record_type
linked_record_id
evidence_level
verification_status
created_at
```

### control_exceptions

```text
id
business_id
department_id
linked_record_type
linked_record_id
risk_level
issue_type
description
assigned_to
status
due_date
created_at
resolved_at
```

### audit_events

```text
id
business_id
actor_user_id
event_type
entity_type
entity_id
old_value
new_value
metadata
created_at
```

---

## Auditability Rules

Every sensitive action must create an audit event.

Track:

```text
User invited
Role changed
Report submitted
Evidence uploaded
Analyst assigned
Analyst unassigned
Analyst note added
Analyst requested clarification
Analyst marked report review-ready
Analyst escalated issue
Approval requested
Approval granted
Approval rejected
Control check completed
Exception created
Exception resolved
Score recalculated
Integrity Report generated
Institution viewed report
```

The audit trail is part of Fulscann-DB's trust moat.

---

## Security Rules

1. Enable Row Level Security on exposed tables.
2. Enforce business-level tenant isolation.
3. Enforce role-based access.
4. Keep institution access consent-based.
5. Keep service-role operations server-side only.
6. Store evidence files in protected buckets.
7. Generate signed URLs where necessary.
8. Log sensitive access.
9. Avoid exposing raw private records to institutions.
10. Institutions should see interpreted reports, not full operational data unless approved.
11. Analysts must only access actively assigned businesses.
12. Analysts must not approve CEO-sensitive actions.
13. Analysts must not share Integrity Reports externally.
14. Analyst notes must not mutate business-owned records.
15. Super Admin assignment and escalation actions must be audited.

---

## Dashboard Scope

### Super Admin Dashboard

Must show:

```text
All analysts
Number of businesses assigned per analyst
Analyst workload
Analyst performance
Businesses without analysts
Escalated cases
Platform-wide IC risk distribution
Report pipeline status
```

### Analyst Dashboard

Must show:

```text
Assigned businesses count
Onboarding status by business
Businesses with open Red/Orange exceptions
Businesses with missing evidence
Businesses ready for Integrity Report
Businesses with declining IC Score
Businesses with declining VeriScore
Businesses inactive for a period
Workload indicator: 0/15 to 15/15
Businesses needing intervention
```

### CEO Dashboard

Must show:

```text
VeriScore
IC Score
Department status
Open exceptions
Evidence completion
KPI performance
Risk heatmap
Pending approvals
Integrity Report status
Suggested actions/forms needing attention
```

### Staff Dashboard

Must show:

```text
Assigned department
Pending reports
Draft reports
Smart form suggestions
Required evidence
Returned corrections
Department status
```

### Institution Dashboard

Must show:

```text
Approved businesses
VeriScore
IC Score
Evidence confidence
Risk flags
Credit-readiness signal
Integrity Report
Historical trend
```

### Enterprise Dashboard

Can come later.

---

## V2 Build Boundary

Build V2 lean.

### Must Build Now

```text
Auth
Business profile
CEO onboarding
Super Admin analyst management
Analyst assignment to businesses
Analyst dashboard
Structural assessment
VeriScore
KPI setup
Department setup
Staff invitation
Department reporting forms
Suggestion Engine for forms
Evidence upload
Basic IC checks
Exception creation
Analyst exception comments and clarification requests
Analyst escalation to Super Admin
Exception resolution
IC Score
CEO dashboard
Institution dashboard
Integrity Report
Audit events
```

### Do Not Build Yet

```text
Complex AI predictions
Full bank API integration
Deep fraud analytics
Large enterprise portfolio tools
Too many sector templates
Advanced report designer
Complex workflow automation
```

---

## Development Phases

### Phase 1: Foundation

- Set up Next.js app
- Set up Supabase project
- Implement auth
- Create schema migrations
- Configure RLS
- Build business profile
- Build role model

### Phase 2: Assessment and VeriScore

- Create assessment forms
- Store responses
- Calculate VeriScore
- Show assessment result
- Explain score drivers

### Phase 3: KPI and Departments

- CEO KPI setup
- Department creation
- Staff invitations
- Role-based dashboards

### Phase 4: Department Reporting

- Sales form
- Finance form
- Procurement form
- Operations form
- HR/Admin form
- Evidence uploads

### Phase 5: Suggestion Engine

- Autocomplete known entities
- Suggest previous values
- Suggest required evidence
- Suggest related records
- Warn on missing fields

### Phase 6: IC Engine

- Implement core rules
- Run control checks
- Create exceptions
- Assign risk levels
- Notify responsible users

### Phase 7: Scores and Reports

- IC Score
- Department scores
- Evidence confidence
- CEO dashboard
- Integrity Report
- Institution dashboard

### Phase 8: Hardening

- Tests
- RLS review
- Audit trail review
- Error handling
- Seed data
- Staging deployment
- Production deployment

---

## Testing Requirements

Use tests for:

```text
Auth guards
Role permissions
RLS assumptions
Analyst assignment limits
Analyst business access boundaries
Assessment scoring
KPI calculations
Suggestion outputs
IC rule checks
Exception creation
Score recalculation
Report generation
Evidence access
Institution access
```

Minimum test categories:

```text
Unit tests
Integration tests
E2E tests for core flows
```

Core E2E flows:

```text
CEO signs up and creates business
Super Admin assigns business to Analyst
Analyst reviews assigned business readiness
CEO completes assessment and receives VeriScore
CEO sets KPIs and creates departments
Staff submits sales report with evidence
Finance submits inflow
IC Engine detects mismatch
Exception is resolved
IC Score updates
Integrity Report is generated
Institution views approved report
```

---

## Codex Instructions

When implementing:

1. Preserve this architecture unless explicitly asked to change it.
2. Keep V2 lean and buildable.
3. Prefer simple, readable code over premature abstraction.
4. Use TypeScript strictly.
5. Validate form inputs with Zod.
6. Keep business logic out of UI components.
7. Put scoring logic in `lib/scoring`.
8. Put IC logic in `lib/ic-engine`.
9. Put suggestion logic in `lib/suggestions`.
10. Keep Supabase service-role usage server-side only.
11. Add audit events for sensitive actions.
12. Do not expose private business data to institution users without approved access.
13. Avoid accusatory language like “fraud confirmed.”
14. Use “potential anomaly,” “mismatch,” “evidence gap,” or “requires review.”
15. Write tests for every core scoring/control function.

---

## Definition of Done for V2

V2 is complete when:

```text
A CEO can sign up
Create a business profile
Fulscann Super Admin can assign a business to an Analyst
Fulscann Analyst can review assigned business readiness
Complete assessment
Receive VeriScore
Set KPIs
Create departments
Invite staff
Staff can submit department reports
Forms provide smart suggestions/autocomplete
Evidence can be uploaded
IC checks can run
Exceptions can be created and resolved
IC Score can update
CEO dashboard shows business control status
Integrity Report can be generated
Institution user can view approved report
Audit events are recorded
```

---

## Product North Star

Fulscann-DB should help SMEs answer:

```text
Are we structured?
Are we controlled?
Are we improving?
Are we fundable?
Can others trust us?
```

The product should always move toward this promise:

```text
Fulscann-DB turns SME activity into verified trust, risk, readiness, and ranking intelligence.
```
