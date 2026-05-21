import { describe, expect, it } from "vitest";
import { IC_RULE_REGISTRY } from "@/lib/ic-engine/rules";

describe("IC rule registry", () => {
  it("registers the core IC rules with score-factor mappings", () => {
    expect(Object.keys(IC_RULE_REGISTRY)).toEqual([
      "required-report",
      "report-evidence",
      "sales-finance-match",
      "procurement-approval"
    ]);

    expect(IC_RULE_REGISTRY["sales-finance-match"].scoreFactors).toContain("financialAlignment");
    expect(IC_RULE_REGISTRY["report-evidence"].scoreFactors).toContain("evidenceCompleteness");
    expect(IC_RULE_REGISTRY["procurement-approval"].scoreFactors).toContain("approvalDiscipline");
  });
});
