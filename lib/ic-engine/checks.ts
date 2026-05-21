import type { RiskLevel } from "@/lib/types";

export type IcCheckStatus = "pass" | "warning" | "fail";

export type IcCheckResult = {
  id: string;
  title: string;
  status: IcCheckStatus;
  riskLevel: RiskLevel;
  description: string;
  scoreImpact: number;
};

export type SalesFinanceCheckInput = {
  salesValue: number;
  financeInflow: number;
  tolerancePercentage?: number;
};

export type SalesFinanceCheckResult = {
  matched: boolean;
  mismatchAmount: number;
  mismatchPercentage: number;
  riskLevel: RiskLevel;
  title?: string;
};

export function checkSalesFinanceMatch(input: SalesFinanceCheckInput): SalesFinanceCheckResult {
  const tolerancePercentage = input.tolerancePercentage ?? 5;
  const mismatchAmount = Math.abs(input.salesValue - input.financeInflow);
  const mismatchPercentage = input.salesValue === 0 ? 0 : (mismatchAmount / input.salesValue) * 100;
  const matched = mismatchPercentage <= tolerancePercentage;

  return {
    matched,
    mismatchAmount,
    mismatchPercentage: Math.round(mismatchPercentage * 10) / 10,
    riskLevel: getMismatchRiskLevel(mismatchPercentage),
    title: matched ? undefined : "Sales-finance mismatch"
  };
}

export function checkReportEvidence(input: {
  reportId: string;
  department: string;
  evidenceCount: number;
  averageEvidenceLevel: number;
  minimumEvidenceCount?: number;
  minimumAverageEvidenceLevel?: number;
}): IcCheckResult {
  const minimumEvidenceCount = input.minimumEvidenceCount ?? 1;
  const minimumAverageEvidenceLevel = input.minimumAverageEvidenceLevel ?? 1.5;
  const missingEvidence = input.evidenceCount < minimumEvidenceCount;
  const weakEvidence = input.averageEvidenceLevel < minimumAverageEvidenceLevel;

  if (missingEvidence) {
    return {
      id: `evidence:${input.reportId}`,
      title: `${formatDepartment(input.department)} evidence missing`,
      status: "fail",
      riskLevel: "Red",
      description: `${formatDepartment(input.department)} report has no supporting evidence attached.`,
      scoreImpact: 30
    };
  }

  if (weakEvidence) {
    return {
      id: `evidence:${input.reportId}`,
      title: `${formatDepartment(input.department)} evidence is weak`,
      status: "warning",
      riskLevel: "Orange",
      description: `${formatDepartment(input.department)} evidence average level is ${input.averageEvidenceLevel}, below ${minimumAverageEvidenceLevel}.`,
      scoreImpact: 18
    };
  }

  return {
    id: `evidence:${input.reportId}`,
    title: `${formatDepartment(input.department)} evidence is acceptable`,
    status: "pass",
    riskLevel: "Green",
    description: `${formatDepartment(input.department)} report has adequate evidence support.`,
    scoreImpact: 0
  };
}

export function checkRequiredDepartmentReports(input: {
  presentDepartments: string[];
  requiredDepartments?: string[];
}): IcCheckResult[] {
  const requiredDepartments = input.requiredDepartments ?? ["sales", "finance"];
  const present = new Set(input.presentDepartments);

  return requiredDepartments.map((department) => {
    const exists = present.has(department);

    return {
      id: `required-report:${department}`,
      title: `${formatDepartment(department)} report ${exists ? "present" : "missing"}`,
      status: exists ? "pass" : "fail",
      riskLevel: exists ? "Green" : "Orange",
      description: exists
        ? `${formatDepartment(department)} report is available for IC review.`
        : `${formatDepartment(department)} report is required before IC readiness can be trusted.`,
      scoreImpact: exists ? 0 : 22
    };
  });
}

export function checkProcurementApproval(input: {
  procurementValue: number;
  hasApprovalEvidence: boolean;
  threshold?: number;
}): IcCheckResult {
  const threshold = input.threshold ?? 1;
  const requiresApproval = input.procurementValue >= threshold;

  if (!requiresApproval) {
    return {
      id: "procurement-approval",
      title: "Procurement approval not required",
      status: "pass",
      riskLevel: "Green",
      description: "No material procurement value is present for approval testing.",
      scoreImpact: 0
    };
  }

  if (!input.hasApprovalEvidence) {
    return {
      id: "procurement-approval",
      title: "Procurement approval gap",
      status: "fail",
      riskLevel: "Orange",
      description: "Procurement activity exists, but no approval evidence is attached.",
      scoreImpact: 24
    };
  }

  return {
    id: "procurement-approval",
    title: "Procurement approval evidenced",
    status: "pass",
    riskLevel: "Green",
    description: "Procurement activity has approval evidence attached.",
    scoreImpact: 0
  };
}

function getMismatchRiskLevel(mismatchPercentage: number): RiskLevel {
  if (mismatchPercentage >= 35) return "Red";
  if (mismatchPercentage >= 15) return "Orange";
  if (mismatchPercentage > 5) return "Yellow";
  return "Green";
}

function formatDepartment(department: string) {
  return department.charAt(0).toUpperCase() + department.slice(1);
}
