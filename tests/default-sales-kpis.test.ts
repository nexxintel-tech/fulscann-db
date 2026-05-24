import { describe, expect, it } from "vitest";
import {
  buildDefaultBusinessKpis,
  DEFAULT_SALES_KPIS,
  getDefaultKpisForDepartment,
  getMissingDefaultBusinessKpis
} from "@/lib/kpis/default-kpis";

describe("default Sales KPI registry", () => {
  it("defines the required stable Sales KPI keys", () => {
    expect(DEFAULT_SALES_KPIS.map((kpi) => kpi.key)).toEqual([
      "monthly_sales_value",
      "sales_target_achievement",
      "invoice_completion_rate",
      "sales_to_finance_match_rate",
      "sales_to_inventory_match_rate",
      "customer_traceability_rate",
      "revenue_collection_rate",
      "outstanding_receivables",
      "sales_exception_rate",
      "repeat_customer_rate"
    ]);
    expect(DEFAULT_SALES_KPIS.every((kpi) => kpi.departmentSlug === "sales" && kpi.isDefault && kpi.isActive)).toBe(true);
  });

  it("builds idempotent business KPI seed rows for Sales departments", () => {
    const rows = buildDefaultBusinessKpis({
      businessId: "biz_001",
      departmentId: "dept_sales",
      departmentSlug: "sales",
      createdBy: "usr_ceo"
    });

    expect(rows).toHaveLength(10);
    expect(new Set(rows.map((row) => `${row.business_id}:${row.department_id}:${row.kpi_key}`)).size).toBe(10);
    expect(rows.find((row) => row.kpi_key === "sales_to_finance_match_rate")?.ic_rule_links).toContain("sales_finance_mismatch");
    expect(rows.find((row) => row.kpi_key === "sales_to_inventory_match_rate")?.ic_rule_links).toContain("inventory_evidence_validation");
  });

  it("returns only missing default KPIs when initialization runs again", () => {
    const existingKpis = DEFAULT_SALES_KPIS.slice(0, 3).map((kpi, index) => ({
      id: `kpi_${index}`,
      businessId: "biz_001",
      departmentId: "dept_sales",
      kpiKey: kpi.key,
      name: kpi.name,
      description: kpi.description,
      measurementType: kpi.measurementType,
      unit: kpi.unit,
      targetValue: null,
      defaultFrequency: kpi.defaultFrequency,
      evidenceRequirements: kpi.evidenceRequirements,
      icRuleLinks: kpi.icRuleLinks,
      scoreFactorLinks: kpi.scoreFactorLinks,
      isDefault: true,
      isActive: true,
      createdBy: "usr_ceo",
      createdAt: "2026-05-23T08:00:00.000Z",
      updatedAt: "2026-05-23T08:00:00.000Z"
    }));

    const missing = getMissingDefaultBusinessKpis({
      existingKpis,
      businessId: "biz_001",
      departmentId: "dept_sales",
      departmentSlug: "sales"
    });

    expect(missing).toHaveLength(7);
    expect(missing.map((kpi) => kpi.key)).not.toContain("monthly_sales_value");
  });

  it("does not create default KPIs for non-Sales departments yet", () => {
    expect(getDefaultKpisForDepartment("finance")).toEqual([]);
  });
});
