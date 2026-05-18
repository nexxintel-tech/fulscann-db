# Auth and RLS

## Current Auth Model

Fulscann-DB uses Supabase Auth for identity and the `profiles` table for application roles.

Supported platform roles:

- `super_admin`
- `analyst`
- `business_user`
- `institution_user`

## Route Protection

Protected route layouts call `requireRole`:

- `/dashboard/super-admin` requires `super_admin`
- `/dashboard/analyst` requires `analyst`
- `/dashboard/ceo` requires `business_user`
- `/institution` requires `institution_user`

When Supabase env vars are not configured, the app runs in demo mode so local UI development remains possible.

## RLS Contract

Dashboard data must be fetched through the cookie-aware Supabase route client so policies evaluate as the logged-in user.

Analyst boundaries:

- Analysts can see only actively assigned businesses.
- Analysts can add notes and escalations for assigned businesses.
- Analysts cannot approve CEO-sensitive actions.
- Analysts cannot share Integrity Reports externally.
- Analysts cannot mutate business-owned records.

## Setup Order

1. Create Supabase project.
2. Apply `db/migrations/0001_foundation.sql`.
3. Create Supabase Auth users for internal users.
4. Insert matching `profiles` rows using the Auth user IDs.
5. Seed businesses and assignments with `db/seed.sql`, or create equivalent records through admin tooling.
6. Add `.env.local`.
7. Sign in through `/login`.
