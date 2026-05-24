import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(join(process.cwd(), "supabase/migrations/0001_foundation.sql"), "utf8");
const institutionAccess = readFileSync(join(process.cwd(), "supabase/migrations/0002_institution_access_rls.sql"), "utf8");
const businessKpis = readFileSync(join(process.cwd(), "supabase/migrations/0004_business_kpis.sql"), "utf8");
const salesKpiSeed = readFileSync(join(process.cwd(), "supabase/migrations/0005_seed_default_sales_kpis.sql"), "utf8");

describe("RLS contract", () => {
  it("keeps evidence storage private and business-scoped", () => {
    expect(foundation).toContain("values ('evidence-files', 'evidence-files', false)");
    expect(foundation).toContain("create policy \"evidence_storage_select_by_business_access\"");
    expect(foundation).toContain("is_business_member((storage.foldername(name))[1]::uuid)");
    expect(foundation).toContain("is_assigned_analyst((storage.foldername(name))[1]::uuid)");
  });

  it("does not give Analysts CEO-owned destructive permissions", () => {
    expect(foundation).toContain("create policy \"control_exceptions_update_by_business_member_or_super_admin\"");
    expect(foundation).not.toContain("control_exceptions for delete");
    expect(foundation).not.toContain("institution_access for delete");
  });

  it("allows Institution users only through active CEO-granted access", () => {
    expect(institutionAccess).toContain("has_active_institution_access");
    expect(institutionAccess).toContain("status = 'active'");
    expect(institutionAccess).toContain("lower(institution_email) = lower(auth.jwt() ->> 'email')");
    expect(institutionAccess).toContain("or has_active_institution_access(id)");
    expect(institutionAccess).toContain("or has_active_institution_access(business_id)");
  });

  it("keeps business KPI management CEO-owned while allowing approved institution summaries", () => {
    expect(businessKpis).toContain("create table if not exists public.business_kpis");
    expect(businessKpis).toContain("alter table public.department_reports");
    expect(businessKpis).toContain("add column if not exists kpi_key text");
    expect(businessKpis).toContain("department_reports_kpi_key_idx");
    expect(businessKpis).toContain("department_reports_business_department_kpi_idx");
    expect(businessKpis).toContain("unique (business_id, department_id, kpi_key)");
    expect(businessKpis).toContain("business_kpis_manage_by_owner_or_super_admin");
    expect(businessKpis).toContain("businesses.owner_user_id = auth.uid()");
    expect(businessKpis).toContain("or has_active_institution_access(business_id)");
    expect(businessKpis).not.toContain("evidence_files");
    expect(businessKpis).not.toContain("storage.objects");
  });

  it("backfills default Sales KPIs without duplicating existing KPI rows", () => {
    expect(salesKpiSeed).toContain("insert into public.business_kpis");
    expect(salesKpiSeed).toContain("where departments.department_type = 'sales'");
    expect(salesKpiSeed).toContain("on conflict (business_id, department_id, kpi_key) do nothing");
    expect(salesKpiSeed).toContain("sales_to_finance_match_rate");
    expect(salesKpiSeed).not.toContain("pricing");
    expect(salesKpiSeed).not.toContain("subscription");
  });
});
