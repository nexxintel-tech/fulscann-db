import { describe, expect, it } from "vitest";
import {
  checkProcurementApproval,
  checkReportEvidence,
  checkRequiredDepartmentReports,
  checkSalesFinanceMatch
} from "@/lib/ic-engine/checks";

describe("IC sales-finance checks", () => {
  it("passes reports within the default tolerance", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 1_000_000,
      financeInflow: 960_000
    });

    expect(result.matched).toBe(true);
    expect(result.riskLevel).toBe("Green");
    expect(result.mismatchPercentage).toBe(4);
    expect(result.title).toBeUndefined();
  });

  it("classifies mismatch risk levels by percentage", () => {
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 940_000 }).riskLevel).toBe("Yellow");
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 850_000 }).riskLevel).toBe("Orange");
    expect(checkSalesFinanceMatch({ salesValue: 1_000_000, financeInflow: 650_000 }).riskLevel).toBe("Red");
  });

  it("supports custom tolerance without changing risk classification", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 1_000_000,
      financeInflow: 900_000,
      tolerancePercentage: 12
    });

    expect(result.matched).toBe(true);
    expect(result.riskLevel).toBe("Yellow");
  });

  it("handles zero reported sales without division errors", () => {
    const result = checkSalesFinanceMatch({
      salesValue: 0,
      financeInflow: 0
    });

    expect(result.matched).toBe(true);
    expect(result.mismatchAmount).toBe(0);
    expect(result.mismatchPercentage).toBe(0);
    expect(result.riskLevel).toBe("Green");
  });

  it("flags missing and weak report evidence", () => {
    expect(
      checkReportEvidence({
        reportId: "rep_1",
        department: "sales",
        evidenceCount: 0,
        averageEvidenceLevel: 0
      }).riskLevel
    ).toBe("Red");

    expect(
      checkReportEvidence({
        reportId: "rep_2",
        department: "finance",
        evidenceCount: 2,
        averageEvidenceLevel: 1
      }).riskLevel
    ).toBe("Orange");
  });

  it("flags missing required department reports", () => {
    const checks = checkRequiredDepartmentReports({
      presentDepartments: ["sales"],
      requiredDepartments: ["sales", "finance"]
    });

    expect(checks.map((check) => [check.id, check.status])).toEqual([
      ["required-report:sales", "pass"],
      ["required-report:finance", "fail"]
    ]);
  });

  it("flags procurement activity without approval evidence", () => {
    const result = checkProcurementApproval({
      procurementValue: 500_000,
      hasApprovalEvidence: false
    });

    expect(result.title).toBe("Procurement approval gap");
    expect(result.riskLevel).toBe("Orange");
  });
});
