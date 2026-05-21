import {
  checkProcurementApproval,
  checkReportEvidence,
  checkRequiredDepartmentReports,
  checkSalesFinanceMatch,
  type IcCheckResult
} from "@/lib/ic-engine/checks";
import {
  type ExceptionCandidate,
  type ExceptionLifecycleReview,
  reviewExceptionCandidates
} from "@/lib/ic-engine/lifecycle";
import { getIcRule } from "@/lib/ic-engine/rules";
import { mapChecksToIcScoreFactors } from "@/lib/ic-engine/score-factors";
import { getAverageEvidenceLevel, getEvidenceCompletionFromLevels, getEvidenceForReport } from "@/lib/evidence/quality";
import type { IcScoreInput } from "@/lib/scoring/ic-score";
import { calculateIcScore } from "@/lib/scoring/ic-score";
import type { ControlException, DepartmentReport, EvidenceFile } from "@/lib/types";

export type IcAutomationResult = {
  shouldCreateException: boolean;
  exception?: ExceptionCandidate;
  icScore: number;
  matched: boolean;
};

export type BusinessIcAutomationResult = {
  checks: IcCheckResult[];
  exceptionCandidates: ExceptionCandidate[];
  exceptionLifecycle: ExceptionLifecycleReview[];
  newExceptionCandidates: ExceptionCandidate[];
  icScore: number;
  scoreFactors: IcScoreInput;
};

export function runSalesFinanceAutomation(input: {
  reports: DepartmentReport[];
  existingExceptions: ControlException[];
  evidenceCompletion: number;
  evidenceFiles?: EvidenceFile[];
}) {
  const latestSales = getLatestReport(input.reports, "sales");
  const latestFinance = getLatestReport(input.reports, "finance");

  if (!latestSales || !latestFinance) {
    return null;
  }

  const evidenceCompleteness = input.evidenceFiles?.length
    ? getEvidenceCompletionFromLevels(input.evidenceFiles)
    : input.evidenceCompletion;
  const check = checkSalesFinanceMatch({
    salesValue: latestSales.value,
    financeInflow: latestFinance.value
  });
  const existingOpenMismatch = input.existingExceptions.some(
    (exception) => exception.title === "Sales-finance mismatch" && exception.status !== "resolved"
  );
  const financialAlignment = check.matched ? 90 : Math.max(30, 100 - check.mismatchPercentage);
  const anomalyRisk = check.matched ? 90 : Math.max(20, 100 - check.mismatchPercentage * 1.5);
  const icScore = calculateIcScore({
    evidenceCompleteness,
    crossDepartmentConsistency: check.matched ? 90 : 55,
    approvalDiscipline: 75,
    financialAlignment,
    reportingTimeliness: 80,
    anomalyRisk,
    resolutionBehavior: existingOpenMismatch ? 45 : 70
  });

  const result: IcAutomationResult = {
    shouldCreateException: !check.matched && !existingOpenMismatch,
    icScore,
    matched: check.matched
  };

  if (!check.matched && check.riskLevel !== "Green") {
    result.exception = {
      title: check.title ?? "Sales-finance mismatch",
      description: `Sales report and finance inflow differ by ${check.mismatchPercentage}% (${check.mismatchAmount}).`,
      riskLevel: check.riskLevel
    };
  }

  return result;
}

export function runBusinessIcAutomation(input: {
  reports: DepartmentReport[];
  existingExceptions: ControlException[];
  evidenceCompletion: number;
  evidenceFiles?: EvidenceFile[];
  requiredDepartments?: DepartmentReport["department"][];
}): BusinessIcAutomationResult {
  const evidenceFiles = input.evidenceFiles ?? [];
  const requiredDepartments = input.requiredDepartments ?? ["sales", "finance"];
  const checks: IcCheckResult[] = [];
  const presentDepartments = input.reports.map((report) => report.department);
  const requiredReportChecks = checkRequiredDepartmentReports({
    presentDepartments,
    requiredDepartments
  });

  checks.push(...requiredReportChecks);

  for (const report of input.reports) {
    const reportEvidence = getEvidenceForReport(evidenceFiles, report.id);
    checks.push(
      checkReportEvidence({
        reportId: report.id,
        department: report.department,
        evidenceCount: reportEvidence.length || report.evidenceCount,
        averageEvidenceLevel: getAverageEvidenceLevel(reportEvidence)
      })
    );
  }

  const procurementReport = getLatestReport(input.reports, "procurement");
  if (procurementReport) {
    const procurementEvidence = getEvidenceForReport(evidenceFiles, procurementReport.id);
    checks.push(
      checkProcurementApproval({
        procurementValue: procurementReport.value,
        hasApprovalEvidence: procurementEvidence.some((file) => file.fileType.includes("approval"))
      })
    );
  }

  const salesFinanceResult = runSalesFinanceAutomation(input);
  if (salesFinanceResult?.exception) {
    checks.push({
      id: "sales-finance-match",
      title: salesFinanceResult.exception.title,
      status: "fail",
      riskLevel: salesFinanceResult.exception.riskLevel,
      description: salesFinanceResult.exception.description,
      scoreImpact: salesFinanceResult.exception.riskLevel === "Red" ? 35 : salesFinanceResult.exception.riskLevel === "Orange" ? 24 : 12
    });
  } else if (salesFinanceResult) {
    checks.push({
      id: "sales-finance-match",
      title: getIcRule("sales-finance-match").title,
      status: "pass",
      riskLevel: "Green",
      description: "Sales report and finance inflow are within tolerance.",
      scoreImpact: 0
    });
  }

  const exceptionCandidates = checks
    .filter((check) => check.riskLevel !== "Green")
    .map((check) => ({
      title: check.title,
      description: check.description,
      riskLevel: check.riskLevel as "Yellow" | "Orange" | "Red"
    }));
  const exceptionLifecycle = reviewExceptionCandidates(exceptionCandidates, input.existingExceptions);
  const newExceptionCandidates = exceptionLifecycle
    .filter((review) => review.shouldCreate)
    .map((review) => review.candidate);
  const evidenceCompleteness = evidenceFiles.length
    ? getEvidenceCompletionFromLevels(evidenceFiles)
    : input.evidenceCompletion;
  const openExceptionCount = input.existingExceptions.filter((exception) => exception.status !== "resolved").length;
  const scoreFactors = mapChecksToIcScoreFactors({
    checks,
    evidenceCompleteness,
    requiredReportCheckIds: requiredReportChecks.map((check) => check.id),
    existingOpenExceptionCount: openExceptionCount,
    salesFinanceScore: salesFinanceResult?.icScore
  });

  return {
    checks,
    exceptionCandidates,
    exceptionLifecycle,
    newExceptionCandidates,
    icScore: calculateIcScore(scoreFactors),
    scoreFactors
  };
}

function getLatestReport(reports: DepartmentReport[], department: DepartmentReport["department"]) {
  return reports
    .filter((report) => report.department === department)
    .at(-1);
}
