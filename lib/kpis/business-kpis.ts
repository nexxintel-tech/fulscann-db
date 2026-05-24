import type { BusinessKpi, BusinessUser, Department, DepartmentReport, EvidenceFile } from "@/lib/types";
import { isDepartmentHeadMembership, isDepartmentMember } from "@/lib/staff/roles";

export function getBusinessKpisForDepartment(input: {
  businessKpis: BusinessKpi[];
  businessId: string;
  departmentId: string;
  activeOnly?: boolean;
}) {
  return input.businessKpis.filter(
    (kpi) =>
      kpi.businessId === input.businessId &&
      kpi.departmentId === input.departmentId &&
      (!input.activeOnly || kpi.isActive)
  );
}

export function getIncompleteDepartmentKpis(input: {
  businessKpis: BusinessKpi[];
  reports: DepartmentReport[];
}) {
  const reportedKpiKeys = new Set(input.reports.map((report) => report.kpiKey).filter(Boolean));

  return input.businessKpis.filter((kpi) => kpi.isActive && !reportedKpiKeys.has(kpi.kpiKey));
}

export function canSubmitKpiReportForDepartment(input: {
  membership: BusinessUser | null;
  department: Department | null;
  kpi: BusinessKpi | null;
}) {
  return Boolean(
    input.membership &&
      input.department &&
      input.kpi &&
      isDepartmentMember(input.membership) &&
      input.membership.departmentId === input.department.id &&
      input.kpi.departmentId === input.department.id &&
      input.kpi.businessId === input.membership.businessId
  );
}

export function canDepartmentHeadViewKpiGaps(input: {
  membership: BusinessUser | null;
  department: Department | null;
  kpi: BusinessKpi | null;
}) {
  return Boolean(
    input.membership &&
      input.department &&
      input.kpi &&
      isDepartmentHeadMembership(input.membership) &&
      input.membership.departmentId === input.department.id &&
      input.kpi.departmentId === input.department.id &&
      input.kpi.businessId === input.membership.businessId
  );
}

export function hasRawKpiEvidenceAccessForInstitution() {
  return false;
}

export function buildCustomKpiKey(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return `custom_${slug || "kpi"}`;
}

export function hasDuplicateBusinessKpi(input: {
  businessKpis: BusinessKpi[];
  businessId: string;
  departmentId: string;
  kpiKey: string;
}) {
  return input.businessKpis.some(
    (kpi) =>
      kpi.businessId === input.businessId &&
      kpi.departmentId === input.departmentId &&
      kpi.kpiKey === input.kpiKey
  );
}

export function getKpiEvidenceCompletion(input: {
  kpi: BusinessKpi;
  reports: DepartmentReport[];
  evidenceFiles: EvidenceFile[];
}) {
  const reports = input.reports.filter((report) => report.kpiKey === input.kpi.kpiKey);
  const reportIds = new Set(reports.map((report) => report.id));
  const linkedEvidenceCount = input.evidenceFiles.filter((evidence) => reportIds.has(evidence.reportId)).length;

  return {
    reportCount: reports.length,
    evidenceCount: linkedEvidenceCount,
    complete: reports.length > 0 && linkedEvidenceCount > 0
  };
}
