import { describe, expect, it } from "vitest";
import { isRecoverableKpiSchemaDrift } from "@/lib/data/repository";

describe("repository KPI schema drift handling", () => {
  it("recognizes missing department report KPI column as recoverable while migrations catch up", () => {
    expect(isRecoverableKpiSchemaDrift({
      message: "column department_reports.kpi_key does not exist"
    })).toBe(true);
  });

  it("recognizes missing business KPI table as recoverable while migrations catch up", () => {
    expect(isRecoverableKpiSchemaDrift({
      message: "Could not find the table 'public.business_kpis' in the schema cache"
    })).toBe(true);
  });

  it("does not hide unrelated repository errors", () => {
    expect(isRecoverableKpiSchemaDrift({
      message: "permission denied for table businesses"
    })).toBe(false);
  });
});
