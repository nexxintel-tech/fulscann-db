-- Run this in the Supabase SQL editor after creating the real Auth users.
-- Replace the emails and names before execution.

with bootstrap_users(email, full_name, platform_role) as (
  values
    ('admin@yourdomain.com', 'Fulscann Super Admin', 'super_admin'),
    ('analyst@yourdomain.com', 'Fulscann Analyst', 'analyst'),
    ('ceo@yourbusiness.com', 'Business CEO', 'business_user')
)
insert into public.profiles (id, email, full_name, platform_role)
select
  auth_users.id,
  auth_users.email,
  bootstrap_users.full_name,
  bootstrap_users.platform_role
from auth.users auth_users
join bootstrap_users
  on lower(auth_users.email) = lower(bootstrap_users.email)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  platform_role = excluded.platform_role,
  updated_at = now();

-- Confirm every intended bootstrap user exists in Auth and now has a profile.
with bootstrap_users(email) as (
  values
    ('admin@yourdomain.com'),
    ('analyst@yourdomain.com'),
    ('ceo@yourbusiness.com')
)
select
  bootstrap_users.email,
  auth_users.id as auth_user_id,
  profiles.platform_role
from bootstrap_users
left join auth.users auth_users
  on lower(auth_users.email) = lower(bootstrap_users.email)
left join public.profiles profiles
  on profiles.id = auth_users.id;
