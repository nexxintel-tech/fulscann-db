import { describe, expect, it } from "vitest";
import { mapChecksToIcScoreFactors } from "@/lib/ic-engine/score-factors";
import type { IcCheckResult } from "@/lib/ic-engine/checks";

describe("IC score-factor mapping", () => {
  it("maps failed rules into explicit score factors", () => {
    const checks: IcCheckResult[] = [
      check("required-report:finance", "fail", 22),
      check("sales-finance-match", "fail", 35),
      check("procurement-approval", "fail", 24),
      check("evidence:rep_1", "warning", 18)
    ];

    const factors = mapChecksToIcScoreFactors({
      checks,
      evidenceCompleteness: 40,
      requiredReportCheckIds: ["required-report:finance"],
      existingOpenExceptionCount: 1,
      salesFinanceScore: 52
    });

    expect(factors.evidenceCompleteness).toBe(40);
    expect(factors.crossDepartmentConsistency).toBe(50);
    expect(factors.approvalDiscipline).toBe(45);
    expect(factors.financialAlignment).toBe(52);
    expect(factors.reportingTimeliness).toBe(70);
    expect(factors.anomalyRisk).toBe(25);
    expect(factors.resolutionBehavior).toBe(64);
  });
});

function check(id: string, status: IcCheckResult["status"], scoreImpact: number): IcCheckResult {
  return {
    id,
    title: id,
    status,
    riskLevel: status === "pass" ? "Green" : "Orange",
    description: id,
    scoreImpact
  };
}
