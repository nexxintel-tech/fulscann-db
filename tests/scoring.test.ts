import { describe, expect, it } from "vitest";
import { checkSalesFinanceMatch } from "@/lib/ic-engine/checks";
import { calculateIcScore } from "@/lib/scoring/ic-score";
import { calculateVeriScore } from "@/lib/scoring/veriscore";

describe("VeriScore", () => {
  it("calculates a weighted maturity score", () => {
    const score = calculateVeriScore([
      { category: "structure", score: 80 },
      { category: "finance", score: 70 },
      { category: "controls", score: 60 },
      { category: "evidence", score: 90 },
      { category: "governance", score: 75 }
    ]);

    expect(score).toBe(74);
  });
});

describe("IC Score", () => {
  it("uses the README component weights", () => {
    const score = calculateIcScore({
      evidenceCompleteness: 80,
      crossDepartmentConsistency: 70,
      approvalDiscipline: 90,
      financialAlignment: 75,
      reportingTimeliness: 60,
      anomalyRisk: 65,
      resolutionBehavior: 100
    });

    expect(score).toBe(75);
  });
});

describe("IC engine checks", () => {
  it("flags material sales-finance mismatch", () => {
    const result = checkSalesFinanceMatch({ salesValue: 2000000, financeInflow: 1200000 });

    expect(result.matched).toBe(false);
    expect(result.mismatchAmount).toBe(800000);
    expect(result.mismatchPercentage).toBe(40);
    expect(result.riskLevel).toBe("Red");
  });
});
