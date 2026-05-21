import {
  checkProcurementApproval,
  checkReportEvidence,
  checkRequiredDepartmentReports,
  checkSalesFinanceMatch,
  type IcCheckResult
} from "@/lib/ic-engine/checks";
import { getAverageEvidenceLevel, getEvidenceCompletionFromLevels, getEvidenceForReport } from "@/lib/evidence/quality";
import { calculateIcScore } from "@/lib/scoring/ic-score";
import type { ControlException, DepartmentReport, EvidenceFile } from "@/lib/types";

type ExceptionCandidate = {
  title: string;
  description: string;
  riskLevel: "Yellow" | "Orange" | "Red";
};

export type IcAutomationResult = {
  shouldCreateException: boolean;
  exception?: ExceptionCandidate;
  icScore: number;
  matched: boolean;
};

export type BusinessIcAutomationResult = {
  checks: IcCheckResult[];
  exceptionCandidates: ExceptionCandidate[];
  newExceptionCandidates: ExceptionCandidate[];
  icScore: number;
  scoreFactors: {
    evidenceCompleteness: number;
    crossDepartmentConsistency: number;
    approvalDiscipline: number;
    financialAlignment: number;
    reportingTimeliness: number;
    anomalyRisk: number;
    resolutionBehavior: number;
  };
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
      title: "Sales-finance match",
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
  const newExceptionCandidates = exceptionCandidates.filter((candidate) => !hasOpenException(input.existingExceptions, candidate.title));
  const evidenceCompleteness = evidenceFiles.length
    ? getEvidenceCompletionFromLevels(evidenceFiles)
    : input.evidenceCompletion;
  const failedRequiredReports = requiredReportChecks.filter((check) => check.status === "fail").length;
  const openExceptionCount = input.existingExceptions.filter((exception) => exception.status !== "resolved").length;
  const totalImpact = checks.reduce((sum, check) => sum + check.scoreImpact, 0);
  const hasSalesFinanceFailure = checks.some((check) => check.id === "sales-finance-match" && check.status === "fail");
  const hasApprovalFailure = checks.some((check) => check.id === "procurement-approval" && check.status === "fail");
  const evidenceFailures = checks.filter((check) => check.id.startsWith("evidence:") && check.status !== "pass").length;
  const scoreFactors = {
    evidenceCompleteness,
    crossDepartmentConsistency: Math.max(35, 100 - failedRequiredReports * 25 - (hasSalesFinanceFailure ? 25 : 0)),
    approvalDiscipline: hasApprovalFailure ? 45 : 82,
    financialAlignment: hasSalesFinanceFailure ? Math.max(35, salesFinanceResult?.icScore ?? 55) : 90,
    reportingTimeliness: Math.max(45, 90 - failedRequiredReports * 20),
    anomalyRisk: Math.max(25, 95 - totalImpact),
    resolutionBehavior: Math.max(35, 78 - openExceptionCount * 8 - evidenceFailures * 6)
  };

  return {
    checks,
    exceptionCandidates,
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

function hasOpenException(exceptions: ControlException[], title: string) {
  return exceptions.some((exception) => exception.title === title && exception.status !== "resolved");
}
