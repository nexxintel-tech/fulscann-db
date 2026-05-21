import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(join(process.cwd(), "supabase/migrations/0001_foundation.sql"), "utf8");
const institutionAccess = readFileSync(join(process.cwd(), "supabase/migrations/0002_institution_access_rls.sql"), "utf8");

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
});
