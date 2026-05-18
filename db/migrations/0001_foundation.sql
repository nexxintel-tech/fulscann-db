create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('evidence-files', 'evidence-files', false)
on conflict (id) do update set public = false;

create table if not exists profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  platform_role text not null check (platform_role in ('super_admin', 'analyst', 'business_user', 'institution_user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  sector text not null,
  location text,
  owner_user_id uuid not null references profiles(id),
  onboarding_progress integer not null default 0 check (onboarding_progress between 0 and 100),
  assessment_complete boolean not null default false,
  kpi_setup_complete boolean not null default false,
  current_veriscore integer not null default 0 check (current_veriscore between 0 and 100),
  previous_veriscore integer not null default 0 check (previous_veriscore between 0 and 100),
  current_ic_score integer not null default 0 check (current_ic_score between 0 and 100),
  previous_ic_score integer not null default 0 check (previous_ic_score between 0 and 100),
  evidence_completion integer not null default 0 check (evidence_completion between 0 and 100),
  integrity_report_ready boolean not null default false,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references profiles(id),
  role text not null,
  department_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  department_type text not null check (department_type in ('sales', 'finance', 'procurement', 'operations', 'hr')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (business_id, department_type)
);

create table if not exists staff_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  email text not null,
  role text not null check (role in ('sales_officer', 'finance_officer', 'procurement_officer', 'operations_officer', 'hr_admin')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invitation_token text not null default replace(gen_random_uuid()::text, '-', ''),
  invited_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (business_id, email)
);

create table if not exists kpi_targets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  target_value numeric(14, 2) not null,
  unit text not null,
  period text not null check (period in ('monthly', 'quarterly', 'annual')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists assessment_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category text not null check (category in ('structure', 'finance', 'controls', 'evidence', 'governance')),
  score integer not null check (score between 0 and 100),
  submitted_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists veriscore_results (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  veriscore integer not null check (veriscore between 0 and 100),
  version text not null default 'v1.0',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists ic_scores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  version text not null default 'v1.0',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists analyst_assignments (
  id uuid primary key default gen_random_uuid(),
  analyst_user_id uuid not null references profiles(id),
  business_id uuid not null references businesses(id) on delete cascade,
  assigned_by uuid not null references profiles(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (analyst_user_id, business_id)
);

create table if not exists department_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  department text not null check (department in ('sales', 'finance', 'procurement', 'operations', 'hr')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'review_ready', 'approved')),
  value numeric(14, 2) not null default 0,
  evidence_count integer not null default 0,
  submitted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists evidence_files (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  report_id uuid not null references department_reports(id) on delete cascade,
  uploaded_by uuid not null references profiles(id),
  file_name text not null,
  file_type text not null,
  storage_path text,
  file_size bigint not null default 0,
  evidence_level integer not null default 1 check (evidence_level between 0 and 3),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists control_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  description text,
  risk_level text not null check (risk_level in ('Green', 'Yellow', 'Orange', 'Red')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists analyst_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  analyst_user_id uuid not null references profiles(id),
  note_type text not null,
  body text not null,
  visibility text not null default 'internal' check (visibility in ('internal', 'business_visible')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists analyst_escalations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  analyst_user_id uuid not null references profiles(id),
  escalated_to uuid not null references profiles(id),
  risk_level text not null check (risk_level in ('Green', 'Yellow', 'Orange', 'Red')),
  reason text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists ceo_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  responder_user_id uuid not null references profiles(id),
  response_type text not null check (response_type in ('clarification_response', 'exception_resolution')),
  body text not null,
  linked_entity_type text not null check (linked_entity_type in ('analyst_note', 'control_exception')),
  linked_entity_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists institution_access (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  institution_name text not null,
  institution_email text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  actor_user_id uuid not null references profiles(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_business_users_user
  on business_users (user_id, business_id)
  where status = 'active';

create index if not exists idx_departments_business
  on departments (business_id, department_type);

create index if not exists idx_staff_invitations_business
  on staff_invitations (business_id, status, created_at desc);

create unique index if not exists idx_staff_invitations_token
  on staff_invitations (invitation_token);

create index if not exists idx_kpi_targets_business
  on kpi_targets (business_id, created_at desc);

create index if not exists idx_assessment_responses_business
  on assessment_responses (business_id, created_at desc);

create index if not exists idx_veriscore_results_business
  on veriscore_results (business_id, created_at desc);

create index if not exists idx_ic_scores_business
  on ic_scores (business_id, created_at desc);

create index if not exists idx_analyst_assignments_active
  on analyst_assignments (analyst_user_id, business_id)
  where status = 'active';

create index if not exists idx_department_reports_business
  on department_reports (business_id, created_at desc);

create index if not exists idx_evidence_files_report
  on evidence_files (report_id, created_at desc);

create index if not exists idx_evidence_files_business
  on evidence_files (business_id, evidence_level);

create index if not exists idx_control_exceptions_business
  on control_exceptions (business_id, status, risk_level);

create index if not exists idx_analyst_notes_business
  on analyst_notes (business_id, created_at desc);

create index if not exists idx_ceo_responses_business
  on ceo_responses (business_id, created_at desc);

create index if not exists idx_institution_access_business
  on institution_access (business_id, status);

create index if not exists idx_audit_events_business
  on audit_events (business_id, created_at desc);

create or replace function current_platform_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select platform_role from profiles where id = auth.uid()
$$;

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select current_platform_role() = 'super_admin'
$$;

create or replace function is_assigned_analyst(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from analyst_assignments
    where analyst_user_id = auth.uid()
      and business_id = target_business_id
      and status = 'active'
  )
$$;

create or replace function is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from business_users
    where user_id = auth.uid()
      and business_id = target_business_id
      and status = 'active'
  )
$$;

create or replace function enforce_analyst_assignment_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  assignee_role text;
  assigner_role text;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select platform_role into assignee_role from profiles where id = new.analyst_user_id;
  select platform_role into assigner_role from profiles where id = new.assigned_by;

  if assignee_role <> 'analyst' then
    raise exception 'Assigned user must be a Fulscann Analyst';
  end if;

  if assigner_role <> 'super_admin' then
    raise exception 'Only a Fulscann Super Admin can assign analysts';
  end if;

  select count(*) into active_count
  from analyst_assignments
  where analyst_user_id = new.analyst_user_id
    and status = 'active'
    and id <> coalesce(new.id, gen_random_uuid());

  if active_count >= 15 then
    raise exception 'Analyst active business limit exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_analyst_assignment_rules on analyst_assignments;
create trigger trg_enforce_analyst_assignment_rules
before insert or update on analyst_assignments
for each row execute function enforce_analyst_assignment_rules();

alter table profiles enable row level security;
alter table businesses enable row level security;
alter table business_users enable row level security;
alter table departments enable row level security;
alter table staff_invitations enable row level security;
alter table kpi_targets enable row level security;
alter table assessment_responses enable row level security;
alter table veriscore_results enable row level security;
alter table ic_scores enable row level security;
alter table analyst_assignments enable row level security;
alter table department_reports enable row level security;
alter table evidence_files enable row level security;
alter table control_exceptions enable row level security;
alter table analyst_notes enable row level security;
alter table analyst_escalations enable row level security;
alter table ceo_responses enable row level security;
alter table institution_access enable row level security;
alter table audit_events enable row level security;

create policy "profiles_select_self_or_internal"
on profiles for select
using (id = auth.uid() or current_platform_role() in ('super_admin', 'analyst'));

create policy "profiles_update_self"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_self"
on profiles for insert
with check (id = auth.uid());

create policy "businesses_select_by_role"
on businesses for select
using (
  is_super_admin()
  or owner_user_id = auth.uid()
  or is_business_member(id)
  or is_assigned_analyst(id)
);

create policy "businesses_insert_by_owner"
on businesses for insert
with check (owner_user_id = auth.uid() or is_super_admin());

create policy "businesses_update_by_owner_or_super_admin"
on businesses for update
using (owner_user_id = auth.uid() or is_super_admin())
with check (owner_user_id = auth.uid() or is_super_admin());

create policy "business_users_select_by_role"
on business_users for select
using (is_super_admin() or user_id = auth.uid() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "business_users_manage_by_owner_or_super_admin"
on business_users for all
using (
  is_super_admin()
  or exists (
    select 1 from businesses
    where businesses.id = business_users.business_id
      and businesses.owner_user_id = auth.uid()
  )
)
with check (
  is_super_admin()
  or exists (
    select 1 from businesses
    where businesses.id = business_users.business_id
      and businesses.owner_user_id = auth.uid()
  )
);

create policy "departments_select_by_business_access"
on departments for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "departments_manage_by_business_member"
on departments for all
using (is_super_admin() or is_business_member(business_id))
with check (is_super_admin() or is_business_member(business_id));

create policy "staff_invitations_select_by_business_access"
on staff_invitations for select
using (
  is_super_admin()
  or is_business_member(business_id)
  or is_assigned_analyst(business_id)
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy "staff_invitations_manage_by_business_member"
on staff_invitations for all
using (is_super_admin() or is_business_member(business_id))
with check (is_super_admin() or is_business_member(business_id));

create policy "staff_invitations_update_by_invited_user"
on staff_invitations for update
using (lower(email) = lower(auth.jwt() ->> 'email') and status = 'pending')
with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "kpi_targets_select_by_business_access"
on kpi_targets for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "kpi_targets_manage_by_business_member"
on kpi_targets for all
using (is_super_admin() or is_business_member(business_id))
with check (is_super_admin() or is_business_member(business_id));

create policy "assessment_responses_select_by_business_access"
on assessment_responses for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "assessment_responses_insert_by_business_member"
on assessment_responses for insert
with check (submitted_by = auth.uid() and is_business_member(business_id));

create policy "veriscore_results_select_by_business_access"
on veriscore_results for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "veriscore_results_insert_by_business_member"
on veriscore_results for insert
with check (created_by = auth.uid() and is_business_member(business_id));

create policy "ic_scores_select_by_business_access"
on ic_scores for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "ic_scores_insert_by_business_member"
on ic_scores for insert
with check (created_by = auth.uid() and is_business_member(business_id));

create policy "analyst_assignments_select_internal_or_owner"
on analyst_assignments for select
using (
  is_super_admin()
  or analyst_user_id = auth.uid()
  or exists (
    select 1 from businesses
    where businesses.id = analyst_assignments.business_id
      and businesses.owner_user_id = auth.uid()
  )
);

create policy "analyst_assignments_manage_super_admin"
on analyst_assignments for all
using (is_super_admin())
with check (is_super_admin());

create policy "department_reports_select_by_business_access"
on department_reports for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "department_reports_write_by_business_member"
on department_reports for all
using (is_super_admin() or is_business_member(business_id))
with check (is_super_admin() or is_business_member(business_id));

create policy "department_reports_review_ready_by_assigned_analyst"
on department_reports for update
using (is_assigned_analyst(business_id))
with check (is_assigned_analyst(business_id) and status = 'review_ready');

create policy "evidence_files_select_by_business_access"
on evidence_files for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "evidence_files_insert_by_business_member"
on evidence_files for insert
with check (uploaded_by = auth.uid() and is_business_member(business_id));

create policy "evidence_storage_select_by_business_access"
on storage.objects for select
using (
  bucket_id = 'evidence-files'
  and (
    is_super_admin()
    or is_business_member((storage.foldername(name))[1]::uuid)
    or is_assigned_analyst((storage.foldername(name))[1]::uuid)
  )
);

create policy "evidence_storage_insert_by_business_member"
on storage.objects for insert
with check (
  bucket_id = 'evidence-files'
  and is_business_member((storage.foldername(name))[1]::uuid)
);

create policy "control_exceptions_select_by_business_access"
on control_exceptions for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "control_exceptions_update_by_business_member_or_super_admin"
on control_exceptions for update
using (is_super_admin() or is_business_member(business_id))
with check (is_super_admin() or is_business_member(business_id));

create policy "analyst_notes_select_by_business_access"
on analyst_notes for select
using (is_super_admin() or is_assigned_analyst(business_id) or is_business_member(business_id));

create policy "analyst_notes_insert_by_assigned_analyst"
on analyst_notes for insert
with check (is_super_admin() or (analyst_user_id = auth.uid() and is_assigned_analyst(business_id)));

create policy "analyst_notes_update_by_author"
on analyst_notes for update
using (is_super_admin() or analyst_user_id = auth.uid())
with check (is_super_admin() or analyst_user_id = auth.uid());

create policy "analyst_escalations_select_internal"
on analyst_escalations for select
using (is_super_admin() or analyst_user_id = auth.uid());

create policy "analyst_escalations_insert_by_assigned_analyst"
on analyst_escalations for insert
with check (is_super_admin() or (analyst_user_id = auth.uid() and is_assigned_analyst(business_id)));

create policy "analyst_escalations_update_super_admin"
on analyst_escalations for update
using (is_super_admin())
with check (is_super_admin());

create policy "ceo_responses_select_by_business_access"
on ceo_responses for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "ceo_responses_insert_by_business_member"
on ceo_responses for insert
with check (responder_user_id = auth.uid() and is_business_member(business_id));

create policy "institution_access_select_by_business_access"
on institution_access for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "institution_access_insert_by_business_member"
on institution_access for insert
with check (granted_by = auth.uid() and is_business_member(business_id));

create policy "institution_access_revoke_by_business_member"
on institution_access for update
using (is_business_member(business_id) or is_super_admin())
with check (is_business_member(business_id) or is_super_admin());

create policy "audit_events_select_by_business_access"
on audit_events for select
using (is_super_admin() or is_business_member(business_id) or is_assigned_analyst(business_id));

create policy "audit_events_insert_server_or_actor"
on audit_events for insert
with check (actor_user_id = auth.uid() or is_super_admin());
