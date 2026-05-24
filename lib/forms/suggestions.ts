import type {
  Business,
  ControlException,
  Department,
  DepartmentReport,
  EvidenceFile,
  KpiTarget,
  BusinessKpi,
  StaffInvitation
} from "@/lib/types";

export type SmartFormSuggestion = {
  id: string;
  title: string;
  detail: string;
  field?: string;
  recommendedValue?: string | number;
  priority: "low" | "medium" | "high";
};

const CORE_DEPARTMENTS: Department["departmentType"][] = ["sales", "finance", "procurement"];

export function getOnboardingFormSuggestions(input: {
  business?: Business;
  departments: Department[];
  kpiTargets: KpiTarget[];
  businessKpis?: BusinessKpi[];
}): SmartFormSuggestion[] {
  const suggestions: SmartFormSuggestion[] = [];

  if (!input.business) {
    suggestions.push({
      id: "business-profile-first",
      title: "Create the business profile first",
      detail: "The remaining onboarding forms need a business record before assessment, KPI, and department setup can be persisted.",
      priority: "high"
    });
    return suggestions;
  }

  const departmentTypes = new Set(input.departments.map((department) => department.departmentType));
  for (const departmentType of CORE_DEPARTMENTS) {
    if (!departmentTypes.has(departmentType)) {
      suggestions.push({
        id: `missing-${departmentType}-department`,
        title: `Add a ${formatDepartment(departmentType)} department`,
        detail: "Core IC checks need sales, finance, and procurement ownership to evaluate reporting completeness.",
        field: "departmentType",
        recommendedValue: departmentType,
        priority: departmentType === "sales" || departmentType === "finance" ? "high" : "medium"
      });
    }
  }

  const salesFinanceKpiExists =
    input.kpiTargets.some((kpi) => /sales|finance|match/i.test(kpi.name)) ||
    input.businessKpis?.some((kpi) => kpi.kpiKey === "sales_to_finance_match_rate");

  if (!salesFinanceKpiExists) {
    suggestions.push({
      id: "sales-finance-kpi",
      title: "Add a Sales-to-Finance Match Rate KPI",
      detail: "This gives the CEO a target that aligns with the IC mismatch rule.",
      field: "name",
      recommendedValue: "Sales-to-Finance Match Rate",
      priority: "medium"
    });
  }

  return suggestions;
}

export function getStaffInviteSuggestions(input: {
  departments: Department[];
  pendingInvitations: StaffInvitation[];
}): SmartFormSuggestion[] {
  const suggestions: SmartFormSuggestion[] = [];
  const pendingDepartmentIds = new Set(input.pendingInvitations.map((invitation) => invitation.departmentId));

  for (const department of input.departments) {
    if (CORE_DEPARTMENTS.includes(department.departmentType) && !pendingDepartmentIds.has(department.id)) {
      suggestions.push({
        id: `invite-${department.id}`,
        title: `Invite a ${formatDepartment(department.departmentType)} owner`,
        detail: "Core departments need staff coverage before report and evidence workflows can operate cleanly.",
        field: "departmentId",
        recommendedValue: department.id,
        priority: department.departmentType === "sales" || department.departmentType === "finance" ? "high" : "medium"
      });
    }
  }

  return suggestions;
}

export function getStaffReportSuggestions(input: {
  department?: Department;
  reports: DepartmentReport[];
  evidenceFiles: EvidenceFile[];
  exceptions: ControlException[];
  businessKpis?: BusinessKpi[];
}): SmartFormSuggestion[] {
  if (!input.department) {
    return [{
      id: "no-assigned-department",
      title: "Wait for department assignment",
      detail: "A staff member needs an active department before submitting operating reports.",
      priority: "high"
    }];
  }

  const suggestions: SmartFormSuggestion[] = [];
  const latestReport = input.reports.at(-1);
  const departmentExceptions = input.exceptions.filter(
    (exception) =>
      exception.status !== "resolved" &&
      exception.title.toLowerCase().includes(input.department!.departmentType)
  );

  if (latestReport) {
    suggestions.push({
      id: "latest-report-value",
      title: "Use the latest report as a reference",
      detail: "Keep the new value consistent with the last submitted department report unless operations changed materially.",
      field: "value",
      recommendedValue: latestReport.value,
      priority: "low"
    });
  }

  const minimumEvidenceCount = departmentExceptions.length > 0 ? 2 : 1;
  suggestions.push({
    id: "minimum-evidence-count",
    title: `Attach at least ${minimumEvidenceCount} evidence file${minimumEvidenceCount === 1 ? "" : "s"}`,
    detail: departmentExceptions.length > 0
      ? "Open IC issues for this department need stronger support before the score can recover."
      : "Every submitted report should have evidence available for IC checks.",
    field: "evidenceCount",
    recommendedValue: minimumEvidenceCount,
    priority: departmentExceptions.length > 0 ? "high" : "medium"
  });

  if (input.evidenceFiles.length === 0 && input.reports.length > 0) {
    suggestions.push({
      id: "missing-evidence-followup",
      title: "Upload evidence after submitting",
      detail: "Reports without evidence will keep triggering evidence quality exceptions.",
      priority: "high"
    });
  }

  if (input.department.departmentType === "sales") {
    suggestions.push(...getSalesKpiReportingSuggestions(input));
  }

  return suggestions;
}

export function getEvidenceUploadSuggestions(input: {
  report?: DepartmentReport;
  exceptions: ControlException[];
  businessKpis?: BusinessKpi[];
}): SmartFormSuggestion[] {
  if (!input.report) {
    return [{
      id: "select-report-first",
      title: "Select a report before uploading evidence",
      detail: "Evidence must be linked to a specific department report for IC checks to use it.",
      priority: "medium"
    }];
  }

  const suggestions: SmartFormSuggestion[] = [
    {
      id: "evidence-level",
      title: "Use Level 2 or higher evidence where possible",
      detail: "Verified or cross-verified evidence improves evidence completeness and IC score recovery.",
      field: "evidenceLevel",
      recommendedValue: 2,
      priority: "medium"
    }
  ];

  const department = input.report.department;
  suggestions.push({
    id: `${department}-file-type`,
    title: `Recommended file type: ${getRecommendedFileType(department)}`,
    detail: "Using a specific evidence type makes review faster and keeps records report-ready.",
    field: "fileType",
    recommendedValue: getRecommendedFileType(department),
    priority: "low"
  });

  if (input.exceptions.some((exception) => exception.status !== "resolved" && exception.riskLevel !== "Green")) {
    suggestions.push({
      id: "open-exception-evidence",
      title: "Prioritize evidence tied to open exceptions",
      detail: "Evidence added after an exception triggers a recheck and can support score recovery.",
      priority: "high"
    });
  }

  if (input.report.department === "sales") {
    suggestions.push({
      id: "sales-invoice-evidence",
      title: "Attach invoice evidence for Sales KPIs",
      detail: "Monthly Sales Value and Invoice Completion Rate need invoices before the report is review-ready.",
      field: "fileType",
      recommendedValue: "invoice",
      priority: "high"
    });

    if (!input.businessKpis?.some((kpi) => kpi.kpiKey === "sales_to_inventory_match_rate" && kpi.isActive)) {
      return suggestions;
    }

    suggestions.push({
      id: "sales-inventory-delivery-evidence",
      title: "Add stock or delivery evidence",
      detail: "Sales-to-Inventory Match Rate needs inventory movement, delivery, or service completion evidence.",
      field: "fileType",
      recommendedValue: "delivery_note",
      priority: "medium"
    });
  }

  return suggestions;
}

function getSalesKpiReportingSuggestions(input: {
  reports: DepartmentReport[];
  evidenceFiles: EvidenceFile[];
  exceptions: ControlException[];
  businessKpis?: BusinessKpi[];
}): SmartFormSuggestion[] {
  const suggestions: SmartFormSuggestion[] = [];
  const activeKpiKeys = new Set(input.businessKpis?.filter((kpi) => kpi.isActive).map((kpi) => kpi.kpiKey) ?? []);
  const latestSalesReport = input.reports.at(-1);

  if (latestSalesReport && input.evidenceFiles.length === 0 && activeKpiKeys.has("invoice_completion_rate")) {
    suggestions.push({
      id: "sales-kpi-missing-invoices",
      title: "Upload invoices for reported sales",
      detail: "Monthly Sales Value without invoice evidence can trigger Sales evidence quality exceptions.",
      priority: "high"
    });
  }

  if (
    latestSalesReport &&
    input.exceptions.some((exception) => exception.title.toLowerCase().includes("sales-finance mismatch")) &&
    activeKpiKeys.has("sales_to_finance_match_rate")
  ) {
    suggestions.push({
      id: "sales-kpi-finance-mismatch-warning",
      title: "Finance inflow is lower than Sales",
      detail: "A Sales-Finance mismatch may be created unless timing or payment evidence explains the gap.",
      priority: "high"
    });
  }

  if (activeKpiKeys.has("sales_to_inventory_match_rate")) {
    suggestions.push({
      id: "sales-kpi-inventory-evidence",
      title: "Link stock or service delivery evidence",
      detail: "Sales-to-Inventory Match Rate needs delivery notes, inventory movement, or service completion evidence.",
      priority: "medium"
    });
  }

  if (activeKpiKeys.has("customer_traceability_rate")) {
    suggestions.push({
      id: "sales-kpi-customer-traceability",
      title: "Add customer traceability details",
      detail: "Customer name, customer code, order reference, or invoice reference improves traceability.",
      priority: "medium"
    });
  }

  if (activeKpiKeys.has("outstanding_receivables")) {
    suggestions.push({
      id: "sales-kpi-receivables-followup",
      title: "Tag unpaid invoices and collection dates",
      detail: "High outstanding receivables should include unpaid invoice references and expected collection dates.",
      priority: "medium"
    });
  }

  return suggestions;
}

export function getCeoExceptionResolutionSuggestions(exception: ControlException): SmartFormSuggestion[] {
  return [
    {
      id: `resolve-${exception.id}-root-cause`,
      title: "State the root cause and corrective action",
      detail: "A resolution note should explain what changed, who acted, and which evidence supports closure.",
      field: "body",
      recommendedValue: `Root cause: . Corrective action: . Evidence attached: . Owner: .`,
      priority: exception.riskLevel === "Red" || exception.riskLevel === "Orange" ? "high" : "medium"
    }
  ];
}

export function getAnalystExceptionSuggestions(exception: ControlException): SmartFormSuggestion[] {
  const suggestions: SmartFormSuggestion[] = [
    {
      id: `clarify-${exception.id}`,
      title: "Ask for the missing control evidence",
      detail: "Request only clarification or support. The CEO remains responsible for resolution and approvals.",
      field: "body",
      recommendedValue: `Please provide evidence or explanation for: ${exception.title}.`,
      priority: "medium"
    }
  ];

  if (exception.riskLevel === "Red" || exception.riskLevel === "Orange") {
    suggestions.push({
      id: `escalate-${exception.id}`,
      title: "Escalate if risk remains unresolved",
      detail: "High-risk exceptions should be escalated when evidence is weak, stale, or inconsistent.",
      field: "body",
      recommendedValue: `${exception.riskLevel} IC exception requires Super Admin review: ${exception.title}.`,
      priority: "high"
    });
  }

  return suggestions;
}

function getRecommendedFileType(department: DepartmentReport["department"]) {
  if (department === "sales") return "invoice";
  if (department === "finance") return "bank_statement";
  if (department === "procurement") return "approval";
  if (department === "hr") return "payroll_register";
  return "operational_report";
}

function formatDepartment(departmentType: Department["departmentType"]) {
  if (departmentType === "hr") return "HR/Admin";
  return departmentType.charAt(0).toUpperCase() + departmentType.slice(1);
}
