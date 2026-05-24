alter table staff_invitations
  drop constraint if exists staff_invitations_role_check;

alter table staff_invitations
  add constraint staff_invitations_role_check
  check (role in (
    'sales_officer',
    'finance_officer',
    'procurement_officer',
    'operations_officer',
    'hr_admin',
    'department_head'
  ));
