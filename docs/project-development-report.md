# Fulscann-DB Project Development Report

Date: 2026-05-21  
Project root: `C:\Users\HP\Fulscann_DB`  
Current focus: Fulscann trust, risk, readiness, and internal control intelligence platform

## 1. Executive Summary

Fulscann-DB has evolved from a README-level concept into a working Next.js application with a defined role hierarchy, a Supabase-ready database model, core dashboards, staff onboarding, evidence handling, internal control scoring, and public demo routes for product inspection.

The main product architecture now supports:

- Fulscann Super Admin oversight
- Fulscann Analyst review and escalation
- Business CEO ownership of business data and approvals
- Staff reporting and evidence submission
- Institution report viewing
- Internal Control scoring and exception generation

Authentication and live Supabase integration were started and partially completed, then intentionally paused so the IC mechanism could be tested without the authentication gate.

At the current stage, the secure `/dashboard/...` routes remain designed for real Auth/RLS usage, while public demo routes such as `/ceo`, `/analyst`, `/superadmin`, `/staff`, `/institutionuser`, and `/ic` bypass auth and use local sample data.

## 2. Technology Stack

The project is implemented as a TypeScript Next.js application.

Core stack:

- Next.js 15
- React 19
- TypeScript
- Supabase Auth, Postgres, Storage, and RLS
- Vitest for unit tests
- Supabase CLI
- GitHub Actions workflow scaffold

Key package scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "supabase:verify": "node scripts/verify-supabase.mjs",
  "supabase:bootstrap-auth": "node scripts/bootstrap-auth-users.mjs"
}
```

## 3. Role Model

The role hierarchy implemented in the product model is:

```text
Fulscann Super Admin
  |
  v
Fulscann Analyst
  |
  v
Assigned Businesses
  |
  v
Business CEO
  |
  v
Business Staff
```

Supported platform roles:

- `super_admin`
- `analyst`
- `business_user`
- `institution_user`

Important business boundary:

The Analyst is not designed to control the business. The Analyst can oversee, review, request clarification, flag evidence issues, mark reports review-ready, and escalate high-risk items. The CEO remains the owner of business profile data, departments, staff, approvals, exception resolution, and external Integrity Report sharing.

## 4. Implemented Application Routes

### Secure Routes

These routes are intended to use real Supabase Auth and role checks:

```text
/dashboard/super-admin
/dashboard/analyst
/dashboard/ceo
/dashboard/ceo/onboarding
/dashboard/ceo/staff
/dashboard/staff
/institution
/staff/accept
/login
```

Role protection is enforced through layout-level `requireRole(...)` calls and the route policy in:

```text
lib/auth/route-policy.ts
lib/auth/session.ts
```

### Public Demo Routes

These were added to bypass authentication for inspection and IC testing:

```text
/superadmin
/analyst
/ceo
/staff
/institutionuser
/institution-demo
/ic
```

These routes use:

```text
lib/data/demo-snapshot.ts
lib/data/sample-data.ts
```

They are read-only and do not write to Supabase.

## 5. Super Admin Implementation

The Super Admin implementation includes:

- View all Analysts
- View number of businesses assigned per Analyst
- View analyst workload
- View businesses without assigned Analysts
- Assign businesses to Analysts
- Track high-risk escalated cases
- View platform-level IC risk distribution
- View report pipeline status

Core files:

```text
app/dashboard/super-admin/page.tsx
app/dashboard/super-admin/actions.ts
app/superadmin/page.tsx
lib/analyst/workload.ts
```

Capacity rule:

```text
Each Analyst can oversee up to 15 active businesses.
```

This is enforced both in application logic and in the database trigger:

```text
enforce_analyst_assignment_rules()
```

## 6. Analyst Implementation

The Analyst dashboard supports:

- Assigned business queue
- Workload indicator
- Open Red/Orange exception monitoring
- Missing evidence monitoring
- Integrity Report readiness review
- Declining IC Score detection
- Inactivity detection
- Internal notes
- Clarification requests
- Report review-ready marking
- Escalation to Super Admin

Core files:

```text
app/dashboard/analyst/page.tsx
app/dashboard/analyst/actions.ts
app/analyst/page.tsx
lib/analyst/readiness.ts
lib/analyst/actions.ts
lib/analyst/workload.ts
```

The Analyst role remains intentionally constrained. It does not approve CEO-sensitive actions, edit core business records, delete business records, or share Integrity Reports externally.

## 7. CEO Implementation

The CEO dashboard supports:

- Business readiness overview
- VeriScore display
- IC Score display
- Evidence completion tracking
- Department report visibility
- Clarification responses
- Exception resolution
- Integrity Report sharing
- Institution access revocation

Core files:

```text
app/dashboard/ceo/page.tsx
app/dashboard/ceo/actions.ts
app/ceo/page.tsx
lib/ceo/actions.ts
```

CEO onboarding supports:

- Business profile creation
- Assessment submission
- VeriScore calculation
- KPI setup
- Department setup

Core files:

```text
app/dashboard/ceo/onboarding/page.tsx
app/dashboard/ceo/onboarding/actions.ts
lib/ceo/onboarding.ts
lib/scoring/veriscore.ts
```

## 8. Staff Implementation

Staff functionality includes:

- CEO-created staff invitations
- Token-based staff invitation acceptance
- Staff membership creation in `business_users`
- Staff dashboard for assigned business and department
- Department report submission
- Evidence metadata attachment
- Evidence file upload to Supabase Storage

Core files:

```text
app/dashboard/ceo/staff/page.tsx
app/dashboard/ceo/staff/actions.ts
app/dashboard/staff/page.tsx
app/dashboard/staff/actions.ts
app/staff/accept/page.tsx
app/staff/accept/actions.ts
app/staff/page.tsx
lib/staff/onboarding.ts
lib/staff/reporting.ts
```

The staff invitation acceptance flow uses the service role key server-side because an invited staff user is not yet a business member at the point where the `business_users` row must be created.

## 9. Institution Implementation

Institution access currently supports approved report visibility only.

Institution users see:

- Approved businesses
- VeriScore
- IC Score
- Evidence confidence
- Report availability

Core files:

```text
app/institution/page.tsx
app/institutionuser/page.tsx
app/institution-demo/page.tsx
```

The intended privacy boundary is that institution users should see interpreted report intelligence only, not raw private operating records unless explicitly approved by the CEO.

## 10. Internal Control Mechanism

The IC component currently focuses on sales-finance consistency.

Core files:

```text
lib/ic-engine/checks.ts
lib/ic-engine/automation.ts
lib/scoring/ic-score.ts
app/ic/page.tsx
```

### Sales-Finance Check

Input:

```ts
{
  salesValue: number;
  financeInflow: number;
  tolerancePercentage?: number;
}
```

Output:

```ts
{
  matched: boolean;
  mismatchAmount: number;
  mismatchPercentage: number;
  riskLevel: "Green" | "Yellow" | "Orange" | "Red";
  title?: string;
}
```

Risk thresholds:

```text
0% - 5%      Green
>5% - <15%   Yellow
15% - <35%   Orange
>=35%        Red
```

Default tolerance:

```text
5%
```

### IC Automation

The automation:

1. Finds latest Sales and Finance reports.
2. Compares Sales value against Finance inflow.
3. Calculates mismatch percentage.
4. Decides whether an exception should be created.
5. Prevents duplicate open Sales-Finance mismatch exceptions.
6. Calculates an IC Score from evidence, consistency, approval discipline, financial alignment, timeliness, anomaly risk, and resolution behavior.

### Public IC Test Route

Use:

```text
/ic
```

Example scenarios:

```text
/ic?sales=1000000&finance=980000&evidence=85
/ic?sales=1000000&finance=850000&evidence=65
/ic?sales=2000000&finance=1200000&evidence=45
```

These represent Green, Orange, and Red scenarios respectively.

## 11. Evidence System

Evidence implementation includes:

- Evidence metadata
- Evidence levels
- Evidence quality scoring
- Private Supabase Storage bucket
- Signed URL generation
- Report-level evidence association

Core files:

```text
lib/evidence/quality.ts
lib/evidence/storage.ts
app/dashboard/staff/actions.ts
```

Evidence storage bucket:

```text
evidence-files
```

The bucket is private.

Expected object path format:

```text
business_id/report_id/file-name.ext
```

This format is required because the RLS storage policies authorize access based on the first folder segment.

## 12. Supabase Schema

The primary migration is:

```text
db/migrations/0001_foundation.sql
supabase/migrations/0001_foundation.sql
```

Main tables:

- `profiles`
- `businesses`
- `business_users`
- `departments`
- `staff_invitations`
- `kpi_targets`
- `assessment_responses`
- `veriscore_results`
- `ic_scores`
- `analyst_assignments`
- `department_reports`
- `evidence_files`
- `control_exceptions`
- `analyst_notes`
- `analyst_escalations`
- `ceo_responses`
- `institution_access`
- `audit_events`

RLS is enabled across the main tables.

Important helper functions:

- `current_platform_role()`
- `is_super_admin()`
- `is_assigned_analyst(target_business_id uuid)`
- `is_business_member(target_business_id uuid)`

Important trigger:

- `enforce_analyst_assignment_rules()`

## 13. Supabase Integration Status

Supabase CLI was linked to the real project:

```text
Project: Fulscann-DB
Project ref: rzyzouqgcwppxyeclhrv
Region: West EU (Ireland)
```

The remote migration was successfully applied:

```text
Local  0001
Remote 0001
```

The original migration used:

```sql
encode(gen_random_bytes(24), 'hex')
```

This failed on the remote project, so it was replaced with:

```sql
replace(gen_random_uuid()::text, '-', '')
```

The live Supabase verification script confirms:

- Auth admin endpoint reachable
- Core tables readable with service role
- `evidence-files` bucket exists
- `evidence-files` bucket is private

Current live data state at last verification:

```text
Auth users: 0
profiles: 0
businesses: 0
business_users: 0
staff_invitations: 0
```

Authentication bootstrap was intentionally paused.

## 14. Auth Bootstrap Utilities

Two bootstrap paths exist.

### SQL Template

```text
supabase/bootstrap_profiles.sql
```

This is intended for use after creating real Supabase Auth users manually.

### Scripted Bootstrap

```text
scripts/bootstrap-auth-users.mjs
```

NPM command:

```bash
npm run supabase:bootstrap-auth
```

It reads a temporary environment variable:

```text
FULSCANN_BOOTSTRAP_USERS
```

It can create Auth users and matching `profiles` rows without committing credentials.

This exists but has not been used to populate the live project.

## 15. Verification and Test Coverage

Current testing framework:

```text
Vitest
```

Implemented test areas:

- Role policy
- Analyst workload
- Analyst action rules
- CEO actions
- CEO onboarding helpers
- Staff reporting
- Staff onboarding
- Evidence quality
- Evidence storage validation
- VeriScore scoring
- IC Score scoring
- IC automation
- IC sales-finance risk thresholds

Most recent relevant IC verification:

```text
IC-focused tests: 11 passed
```

Full suite after IC test addition:

```text
13 test files
41 tests passed
```

Production build after adding public demo routes:

```text
npm run build passed
```

## 16. Git History

Recent commits include:

```text
a5b704f Add public demo role routes
962a051 Add IC risk threshold tests
1641d81 Add Supabase Auth bootstrap utility
a0bf702 Clarify missing profile login error
4ff3095 Add Supabase verification script
1b811a3 Add Supabase profile bootstrap guide
f993546 Fix Supabase migration token default
682741a Add repository line ending rules
58b93b5 Initial Fulscann secure workflow
```

The project has a local Git repository rooted at:

```text
C:\Users\HP\Fulscann_DB
```

This was created because the parent directory was incorrectly acting as the Git root, which risked tracking unrelated user-profile files.

## 17. Known Issues and Gaps

### 17.1 Authentication Is Paused

Auth integration exists, but the live Supabase project has no Auth users or profile rows yet.

Impact:

- Secure `/dashboard/...` routes will redirect or fail to resolve useful live data until users and profiles exist.
- Public demo routes are currently the right path for IC/product inspection.

### 17.2 Demo Routes Are Read-Only

Public routes bypass auth and use local sample data.

Impact:

- They are suitable for review and IC scenario testing.
- They are not suitable for validating RLS writes, real staff acceptance, real evidence upload, or real CEO actions.

### 17.3 IC Coverage Is Still Narrow

The IC mechanism currently covers Sales vs Finance matching.

Missing future IC checks:

- Procurement approval gaps
- Expense evidence gaps
- Department reporting inactivity
- KPI-report inconsistency
- Evidence quality decline
- Repeated exception behavior
- Late resolution behavior
- Cross-period score movement

### 17.4 Dev Server Stability

The Next dev server has sometimes become stale after failed builds or `.next` cache locking.

Known remediation:

1. Stop running Node/Next processes.
2. Delete only the generated `.next` directory.
3. Restart `npm run dev`.

### 17.5 GitHub Remote Not Connected

GitHub connector failed in the session, and GitHub CLI was not installed.

Impact:

- Local commits exist.
- Remote repo push still needs to be done manually.

## 18. Current Public Test Instructions

Start the server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000/ic
```

Public routes:

```text
http://localhost:3000/superadmin
http://localhost:3000/analyst
http://localhost:3000/ceo
http://localhost:3000/staff
http://localhost:3000/institutionuser
http://localhost:3000/institution-demo
http://localhost:3000/ic
```

IC examples:

```text
http://localhost:3000/ic?sales=1000000&finance=980000&evidence=85
http://localhost:3000/ic?sales=1000000&finance=850000&evidence=65
http://localhost:3000/ic?sales=2000000&finance=1200000&evidence=45
```

## 19. Recommended Next Steps

### Step 1: Improve IC Engine Before Returning to Auth

Expand the IC mechanism beyond Sales-Finance matching.

Recommended next checks:

1. Sales report exists but evidence level is weak.
2. Finance report submitted without bank evidence.
3. Procurement department has value but no approval evidence.
4. Operations report missing after business activity.
5. Repeated mismatches across reporting periods.
6. Exception resolved without evidence improvement.

### Step 2: Create an IC Results View

The `/ic` route should evolve from a simple scenario checker into a fuller IC workbench:

- Inputs panel
- Rule results table
- Exception preview
- IC Score breakdown
- Evidence contribution breakdown
- Recommended intervention

### Step 3: Add Persistent IC Simulation

Add a local-only simulation page or API route that can run multiple checks against sample reports and show:

- Which exceptions would be generated
- Which existing exceptions prevent duplicates
- New IC Score
- Score movement from previous IC Score

### Step 4: Return to Auth After IC Is Stronger

Once IC behavior is clearer:

1. Create real Supabase Auth users.
2. Bootstrap profiles.
3. Test secure CEO onboarding.
4. Test staff invitation acceptance.
5. Test evidence upload into private storage.
6. Test Analyst read-only oversight.
7. Test Institution report access.

## 20. CTO Assessment

The project is now past concept stage. It has a credible domain model, working role-specific dashboards, a Supabase-ready security model, and an initial IC engine. The main architectural direction is sound: role boundaries are explicit, CEO ownership is preserved, Analyst authority is limited, and evidence/IC logic is separated from UI components.

The weakest area is not the infrastructure. It is the depth of the IC engine. The current Sales-Finance matching check proves the pattern, but the product needs a broader internal control rule library before the IC Score can carry serious analytical weight.

The next high-value engineering move is to build out the IC rule engine and IC workbench before resuming authentication and production workflow hardening.
