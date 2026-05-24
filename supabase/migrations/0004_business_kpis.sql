create table if not exists public.business_kpis (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  kpi_key text not null,
  name text not null,
  description text,
  measurement_type text not null,
  unit text,
  target_value numeric(14, 2),
  default_frequency text not null default 'monthly' check (default_frequency in ('monthly', 'quarterly', 'annual')),
  evidence_requirements jsonb not null default '[]'::jsonb,
  ic_rule_links jsonb not null default '[]'::jsonb,
  score_factor_links jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, department_id, kpi_key)
);

alter table public.department_reports
  add column if not exists kpi_key text;

create index if not exists department_reports_kpi_key_idx
  on public.department_reports (kpi_key);

create index if not exists department_reports_business_department_kpi_idx
  on public.department_reports (business_id, department, kpi_key);

create index if not exists idx_business_kpis_business_department
  on public.business_kpis (business_id, department_id, is_active);

create index if not exists idx_business_kpis_key
  on public.business_kpis (business_id, kpi_key);

create index if not exists business_kpis_business_id_idx
  on public.business_kpis (business_id);

create index if not exists business_kpis_department_id_idx
  on public.business_kpis (department_id);

create index if not exists business_kpis_kpi_key_idx
  on public.business_kpis (kpi_key);

alter table public.business_kpis enable row level security;

create policy "business_kpis_select_by_business_access"
on business_kpis for select
using (
  is_super_admin()
  or is_business_member(business_id)
  or is_assigned_analyst(business_id)
  or has_active_institution_access(business_id)
);

create policy "business_kpis_manage_by_owner_or_super_admin"
on business_kpis for all
using (
  is_super_admin()
  or exists (
    select 1 from businesses
    where businesses.id = business_kpis.business_id
      and businesses.owner_user_id = auth.uid()
  )
)
with check (
  is_super_admin()
  or exists (
    select 1 from businesses
    where businesses.id = business_kpis.business_id
      and businesses.owner_user_id = auth.uid()
  )
);
