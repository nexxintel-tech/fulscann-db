create or replace function has_active_institution_access(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from institution_access
    where business_id = target_business_id
      and status = 'active'
      and lower(institution_email) = lower(auth.jwt() ->> 'email')
  )
$$;

drop policy if exists "businesses_select_by_role" on businesses;
create policy "businesses_select_by_role"
on businesses for select
using (
  is_super_admin()
  or owner_user_id = auth.uid()
  or is_business_member(id)
  or is_assigned_analyst(id)
  or has_active_institution_access(id)
);

drop policy if exists "control_exceptions_select_by_business_access" on control_exceptions;
create policy "control_exceptions_select_by_business_access"
on control_exceptions for select
using (
  is_super_admin()
  or is_business_member(business_id)
  or is_assigned_analyst(business_id)
  or has_active_institution_access(business_id)
);

drop policy if exists "institution_access_select_by_business_access" on institution_access;
create policy "institution_access_select_by_business_access"
on institution_access for select
using (
  is_super_admin()
  or is_business_member(business_id)
  or is_assigned_analyst(business_id)
  or (status = 'active' and lower(institution_email) = lower(auth.jwt() ->> 'email'))
);
