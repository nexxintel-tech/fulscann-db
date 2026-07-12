# Supabase Integration Runbook

This app is ready to run in demo mode without Supabase and secure mode with real Supabase Auth, Postgres, Storage, and RLS.

## Required Environment

Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_APP_URL=https://verilab.fulscann.com
APP_ENV=local
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is required for staff invitation acceptance because the invited user is not yet a business member when the membership row is created.

`NEXT_PUBLIC_APP_URL` is the canonical browser origin used in Supabase Auth email links. Do not include a trailing slash.

Examples:

```bash
# Production
NEXT_PUBLIC_APP_URL=https://verilab.fulscann.com

# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
3. Add redirect URLs for local and deployed environments:
   - `https://verilab.fulscann.com/auth/callback`
   - `http://localhost:3000/auth/callback`
   - any staging callback URL, for example `https://staging.example.com/auth/callback`
4. Create initial users for:
   - Fulscann Super Admin
   - Fulscann Analyst
   - Business CEO
   - Staff invitee

The `profiles` table must contain a row for internal users. Staff invite acceptance can create or update the invited user's profile automatically.

Supabase Auth sends the signup confirmation and password-reset emails. The application does not call Resend directly for these Auth emails.

### Auth Email Redirects

The app sends explicit Supabase Auth redirect URLs from server actions:

- Signup confirmation: `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard/ceo/onboarding`
- Forgot password: `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`

If `NEXT_PUBLIC_APP_URL` is missing in local development, the app falls back to the request host headers and finally `http://localhost:3000`. Production must set `NEXT_PUBLIC_APP_URL`.

The forgot-password flow is:

1. User opens `/forgot-password`.
2. The server action calls `supabase.auth.resetPasswordForEmail()` with `redirectTo` set to `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`.
3. Supabase Auth sends the reset email through the configured Auth SMTP provider.
4. User opens the email link.
5. Supabase redirects to `/auth/callback?next=/reset-password` with a recovery code.
6. `/auth/callback` exchanges the code for a Supabase session cookie and redirects to `/reset-password`.
7. User submits a new password.
8. The server action calls `supabase.auth.updateUser({ password })`, signs the user out, and redirects to `/login?reset=password-updated`.

### Resend SMTP for Supabase Auth

For production, configure Resend as Supabase custom SMTP in the Supabase dashboard. Do not add a Resend API call to the app for Supabase Auth emails.

Use these SMTP settings:

```text
Host: smtp.resend.com
Port: 587 or 465
Username: resend
Password: RESEND_API_KEY
Sender: no-reply@<verified-domain>
```

The sender domain must be verified in Resend before production use. Configure DNS for the sending domain:

- SPF: authorize Resend to send mail for the domain.
- DKIM: add the Resend DKIM records.
- DMARC: publish a DMARC policy for the domain.

After DNS verification, send a test signup and password-reset email from Supabase Auth and confirm the links resolve to the expected `/auth/callback` URL.

## Bootstrap Real Profiles

After creating the first Auth users, run `supabase/bootstrap_profiles.sql` in the Supabase SQL editor.

Before running it, replace the placeholder emails and names with your real accounts:

```sql
('admin@yourdomain.com', 'Fulscann Super Admin', 'super_admin'),
('analyst@yourdomain.com', 'Fulscann Analyst', 'analyst'),
('ceo@yourbusiness.com', 'Business CEO', 'business_user')
```

This step is required because the app authorizes users from `public.profiles`, while Supabase Auth owns the actual login identity in `auth.users`. The profile `id` must match the Auth user `id`.

Do not use `db/seed.sql` for the live project unless you intentionally want demo records. The seed file contains fixed sample UUIDs and is mainly for local/demo validation.

Alternatively, create the first Auth users and matching profiles from this project without committing any credentials:

```powershell
$env:FULSCANN_BOOTSTRAP_USERS='[
  {"email":"admin@yourdomain.com","password":"ChangeThisAdminPassword1!","fullName":"Fulscann Super Admin","platformRole":"super_admin"},
  {"email":"analyst@yourdomain.com","password":"ChangeThisAnalystPassword1!","fullName":"Fulscann Analyst","platformRole":"analyst"},
  {"email":"ceo@yourbusiness.com","password":"ChangeThisCeoPassword1!","fullName":"Business CEO","platformRole":"business_user"}
]'
npm run supabase:bootstrap-auth
Remove-Item Env:FULSCANN_BOOTSTRAP_USERS
```

The script uses the server-only service role key from `.env.local`, confirms Auth emails if it creates them, and upserts `public.profiles` with matching Auth user IDs.

## Storage Setup

The migration creates a private `evidence-files` bucket and storage policies.

Evidence object paths must begin with the business id:

```text
business_id/report_id/file-name.ext
```

That path format is required by the RLS policies that authorize business members and assigned analysts.

## Verify Connection

Run:

```bash
npm run supabase:verify
```

This checks that `.env.local` can reach the Supabase project with the service role, confirms core tables are readable, and confirms the `evidence-files` bucket exists and is private. The command prints counts/status only, not secrets.

## Verify Secure RLS Workflow

After real Auth users and live workflow records exist, run the anon-key RLS verifier. This signs in as real users and checks what each role can see through RLS. It does not print passwords or use the service role for role checks.

```powershell
$env:FULSCANN_TEST_USERS='{
  "superAdmin":{"email":"admin@yourdomain.com","password":"ChangeThisAdminPassword1!"},
  "analyst":{"email":"analyst@yourdomain.com","password":"ChangeThisAnalystPassword1!"},
  "ceo":{"email":"ceo@yourbusiness.com","password":"ChangeThisCeoPassword1!"},
  "staff":{"email":"staff@yourbusiness.com","password":"ChangeThisStaffPassword1!"},
  "institution":{"email":"credit@example.com","password":"ChangeThisInstitutionPassword1!"}
}'
npm run supabase:verify-secure
Remove-Item Env:FULSCANN_TEST_USERS
```

Expected prerequisites:

- every Auth user has a matching `profiles.id`
- CEO has at least one business
- staff user has accepted an invitation and has an active `business_users` row
- Analyst has at least one active assignment
- Institution user has an active CEO-granted `institution_access` row using the same email as the Auth user

If any prerequisite is missing, the verifier fails with the missing workflow state instead of bypassing RLS.

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
11. Sign in as Institution user and verify only CEO-granted approved reports are visible.
12. Run `npm run supabase:verify-secure` with the same test users.

## GitHub Secrets

Add these repository secrets before relying on CI build checks:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

Do not add `DATABASE_URL` to GitHub unless a workflow specifically needs direct database access.
