import type { IcScoreInput } from "@/lib/scoring/ic-score";
import type { RiskLevel } from "@/lib/types";

export type IcRuleId =
  | "required-report"
  | "report-evidence"
  | "sales-finance-match"
  | "procurement-approval";

export type IcRuleDefinition = {
  id: IcRuleId;
  title: string;
  description: string;
  defaultRiskLevel: RiskLevel;
  scoreFactors: (keyof IcScoreInput)[];
};

export const IC_RULE_REGISTRY: Record<IcRuleId, IcRuleDefinition> = {
  "required-report": {
    id: "required-report",
    title: "Required department report",
    description: "Confirms required departments have submitted reports for IC review.",
    defaultRiskLevel: "Orange",
    scoreFactors: ["crossDepartmentConsistency", "reportingTimeliness"]
  },
  "report-evidence": {
    id: "report-evidence",
    title: "Report evidence quality",
    description: "Checks that department reports have adequate evidence support.",
    defaultRiskLevel: "Orange",
    scoreFactors: ["evidenceCompleteness", "anomalyRisk", "resolutionBehavior"]
  },
  "sales-finance-match": {
    id: "sales-finance-match",
    title: "Sales-finance match",
    description: "Compares sales reporting against finance inflow within tolerance.",
    defaultRiskLevel: "Red",
    scoreFactors: ["crossDepartmentConsistency", "financialAlignment", "anomalyRisk"]
  },
  "procurement-approval": {
    id: "procurement-approval",
    title: "Procurement approval",
    description: "Checks that procurement activity has approval evidence.",
    defaultRiskLevel: "Orange",
    scoreFactors: ["approvalDiscipline", "anomalyRisk"]
  }
};

export function getIcRule(ruleId: IcRuleId) {
  return IC_RULE_REGISTRY[ruleId];
}
