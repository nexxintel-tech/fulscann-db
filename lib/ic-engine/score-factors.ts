import type { IcCheckResult } from "@/lib/ic-engine/checks";
import type { IcScoreInput } from "@/lib/scoring/ic-score";

export type IcScoreFactorInput = {
  checks: IcCheckResult[];
  evidenceCompleteness: number;
  requiredReportCheckIds: string[];
  existingOpenExceptionCount: number;
  salesFinanceScore?: number;
};

export function mapChecksToIcScoreFactors(input: IcScoreFactorInput): IcScoreInput {
  const failedRequiredReports = input.checks.filter(
    (check) => input.requiredReportCheckIds.includes(check.id) && check.status === "fail"
  ).length;
  const totalImpact = input.checks.reduce((sum, check) => sum + check.scoreImpact, 0);
  const hasSalesFinanceFailure = input.checks.some((check) => check.id === "sales-finance-match" && check.status === "fail");
  const hasApprovalFailure = input.checks.some((check) => check.id === "procurement-approval" && check.status === "fail");
  const evidenceFailures = input.checks.filter((check) => check.id.startsWith("evidence:") && check.status !== "pass").length;

  return {
    evidenceCompleteness: input.evidenceCompleteness,
    crossDepartmentConsistency: Math.max(35, 100 - failedRequiredReports * 25 - (hasSalesFinanceFailure ? 25 : 0)),
    approvalDiscipline: hasApprovalFailure ? 45 : 82,
    financialAlignment: hasSalesFinanceFailure ? Math.max(35, input.salesFinanceScore ?? 55) : 90,
    reportingTimeliness: Math.max(45, 90 - failedRequiredReports * 20),
    anomalyRisk: Math.max(25, 95 - totalImpact),
    resolutionBehavior: Math.max(35, 78 - input.existingOpenExceptionCount * 8 - evidenceFailures * 6)
  };
}
