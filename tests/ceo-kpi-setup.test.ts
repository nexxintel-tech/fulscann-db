import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_KPIS, getSelectableDefaultKpis } from "@/lib/kpis/default-kpis";
import { businessKpis } from "@/lib/data/sample-data";
import { hasDuplicateBusinessKpi } from "@/lib/kpis/business-kpis";
import { buildBusinessKpiInsertPayload } from "@/lib/kpis/kpi-form";

const onboardingPage = readFileSync(join(process.cwd(), "app/dashboard/ceo/onboarding/page.tsx"), "utf8");
const selectorForm = readFileSync(join(process.cwd(), "components/kpis/kpi-selector-form.tsx"), "utf8");

describe("CEO KPI setup flow", () => {
  it("uses the default Sales KPI registry as dropdown options", () => {
    expect(DEFAULT_SALES_KPIS.map((kpi) => kpi.name)).toEqual([
      "Monthly Sales Value",
      "Sales Target Achievement",
      "Invoice Completion Rate",
      "Sales-to-Finance Match Rate",
      "Sales-to-Inventory Match Rate",
      "Customer Traceability Rate",
      "Revenue Collection Rate",
      "Outstanding Receivables",
      "Sales Exception Rate",
      "Repeat Customer Rate"
    ]);
    expect(selectorForm).toContain("<option value=\"custom\">Add custom KPI</option>");
  });

  it("does not show selected/current or legacy KPI sections as separate CEO-facing sections", () => {
    expect(onboardingPage).not.toContain("Legacy KPI targets");
    expect(onboardingPage).not.toContain("Selected Business KPIs");
    expect(onboardingPage).not.toContain("Current KPIs");
    expect(onboardingPage).not.toContain("createKpiTarget");
    expect(onboardingPage).toContain("KPI setup");
  });

  it("filters already-added default KPIs out of the dropdown options", () => {
    const selectable = getSelectableDefaultKpis({
      departmentSlug: "sales",
      existingKpiKeys: ["monthly_sales_value", "sales_to_finance_match_rate"]
    });

    expect(selectable.map((kpi) => kpi.key)).not.toContain("monthly_sales_value");
    expect(selectable.map((kpi) => kpi.key)).not.toContain("sales_to_finance_match_rate");
    expect(selectable.map((kpi) => kpi.key)).toContain("invoice_completion_rate");
  });

  it("builds a default business KPI insert payload with IC metadata", () => {
    const payload = buildBusinessKpiInsertPayload({
      businessId: "biz_001",
      department: { id: "dept_sales", departmentType: "sales" },
      selectedKpiKey: "sales_to_finance_match_rate",
      targetValue: 95,
      unit: "%",
      defaultFrequency: "monthly",
      createdBy: "usr_ceo"
    });

    expect(payload).toMatchObject({
      kpi_key: "sales_to_finance_match_rate",
      name: "Sales-to-Finance Match Rate",
      is_default: true,
      target_value: 95
    });
    expect(payload.ic_rule_links).toContain("sales_finance_mismatch");
  });

  it("builds a custom business KPI insert payload with a stable custom key", () => {
    const payload = buildBusinessKpiInsertPayload({
      businessId: "biz_001",
      department: { id: "dept_sales", departmentType: "sales" },
      selectedKpiKey: "custom",
      customName: "Customer Win Back Rate",
      targetValue: 20,
      unit: "%",
      defaultFrequency: "quarterly",
      createdBy: "usr_ceo"
    });

    expect(payload).toMatchObject({
      kpi_key: "custom_customer_win_back_rate",
      name: "Customer Win Back Rate",
      is_default: false,
      is_active: true
    });
    expect(payload.ic_rule_links).toEqual([]);
  });

  it("detects duplicate default and custom KPI keys before insert", () => {
    expect(hasDuplicateBusinessKpi({
      businessKpis,
      businessId: "biz_001",
      departmentId: "dept_001",
      kpiKey: "monthly_sales_value"
    })).toBe(true);

    expect(hasDuplicateBusinessKpi({
      businessKpis,
      businessId: "biz_001",
      departmentId: "dept_001",
      kpiKey: "custom_new_kpi"
    })).toBe(false);
  });

  it("rejects invalid default and invalid custom KPI inputs before insert", () => {
    expect(() => buildBusinessKpiInsertPayload({
      businessId: "biz_001",
      department: { id: "dept_sales", departmentType: "sales" },
      selectedKpiKey: "unknown",
      targetValue: 1,
      unit: "%",
      defaultFrequency: "monthly",
      createdBy: "usr_ceo"
    })).toThrow("invalid-kpi");

    expect(() => buildBusinessKpiInsertPayload({
      businessId: "biz_001",
      department: { id: "dept_sales", departmentType: "sales" },
      selectedKpiKey: "custom",
      customName: " ",
      targetValue: 1,
      unit: "%",
      defaultFrequency: "monthly",
      createdBy: "usr_ceo"
    })).toThrow("invalid");
  });
});
