# Supabase Integration Runbook

This app is ready to run in demo mode without Supabase and secure mode with real Supabase Auth, Postgres, Storage, and RLS.

## Required Environment

Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=local
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is required for staff invitation acceptance because the invited user is not yet a business member when the membership row is created.

## Apply Database

From the project root:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

If you want demo records:

```bash
supabase db reset --linked
```

For a production project, avoid `db reset`; apply migrations only and create users/businesses through controlled setup.

## Auth Setup

In Supabase Auth:

1. Enable Email provider.
2. Set Site URL to `NEXT_PUBLIC_APP_URL`.
3. Add redirect URLs for local and deployed environments.
4. Create initial users for:
   - Fulscann Super Admin
   - Fulscann Analyst
   - Business CEO
   - Staff invitee

The `profiles` table must contain a row for internal users. Staff invite acceptance can create or update the invited user's profile automatically.

## Storage Setup

The migration creates a private `evidence-files` bucket and storage policies.

Evidence object paths must begin with the business id:

```text
business_id/report_id/file-name.ext
```

That path format is required by the RLS policies that authorize business members and assigned analysts.

## First Secure Workflow Test

1. Sign in as a CEO.
2. Complete onboarding enough to create departments.
3. Invite a staff user from `/dashboard/ceo/staff`.
4. Open the generated `/staff/accept?token=...` link as the invited staff email.
5. Accept the invitation.
6. Confirm a `business_users` row was created for the staff user.
7. Submit a department report from `/dashboard/staff`.
8. Attach an evidence file.
9. Sign in as CEO and verify the report/evidence.
10. Sign in as Analyst and verify assigned-business read access without CEO-level mutation rights.

## GitHub Secrets

Add these repository secrets before relying on CI build checks:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

Do not add `DATABASE_URL` to GitHub unless a workflow specifically needs direct database access.
