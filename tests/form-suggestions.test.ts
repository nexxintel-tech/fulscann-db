import { describe, expect, it } from "vitest";
import {
  getAnalystExceptionSuggestions,
  getCeoExceptionResolutionSuggestions,
  getEvidenceUploadSuggestions,
  getOnboardingFormSuggestions,
  getStaffInviteSuggestions,
  getStaffReportSuggestions
} from "@/lib/forms/suggestions";
import {
  businesses,
  businessKpis,
  controlExceptions,
  departments,
  departmentReports,
  staffInvitations
} from "@/lib/data/sample-data";

describe("smart form suggestions", () => {
  it("prioritizes missing onboarding structure", () => {
    const suggestions = getOnboardingFormSuggestions({
      business: businesses[0],
      departments: departments.filter((department) => department.businessId === "biz_001"),
      kpiTargets: []
    });

    expect(suggestions.map((suggestion) => suggestion.id)).toContain("missing-procurement-department");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-finance-kpi");
  });

  it("suggests staff invites for core departments without pending invitations", () => {
    const suggestions = getStaffInviteSuggestions({
      departments: departments.filter((department) => department.businessId === "biz_001"),
      pendingInvitations: staffInvitations
    });

    expect(suggestions.map((suggestion) => suggestion.recommendedValue)).toContain("dept_002");
  });

  it("raises evidence expectations when open department exceptions exist", () => {
    const suggestions = getStaffReportSuggestions({
      department: departments[0],
      reports: departmentReports.filter((report) => report.businessId === "biz_001"),
      evidenceFiles: [],
      exceptions: [
        {
          id: "exc_sales",
          businessId: "biz_001",
          title: "Sales evidence missing",
          riskLevel: "Orange",
          status: "open",
          daysOpen: 1
        }
      ]
    });

    expect(suggestions.find((suggestion) => suggestion.id === "minimum-evidence-count")).toMatchObject({
      recommendedValue: 2,
      priority: "high"
    });
  });

  it("adds Sales KPI-aware reporting suggestions", () => {
    const suggestions = getStaffReportSuggestions({
      department: departments.find((department) => department.departmentType === "sales"),
      reports: departmentReports.filter((report) => report.department === "sales"),
      evidenceFiles: [],
      exceptions: [
        ...controlExceptions,
        {
          id: "exc_sales_finance",
          businessId: "biz_001",
          title: "Sales-finance mismatch",
          riskLevel: "Orange",
          status: "open",
          daysOpen: 1
        }
      ],
      businessKpis
    });

    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-kpi-missing-invoices");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-kpi-finance-mismatch-warning");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-kpi-customer-traceability");
  });

  it("recommends department-specific evidence file types", () => {
    const procurementReport = {
      ...departmentReports[0],
      department: "procurement" as const
    };
    const suggestions = getEvidenceUploadSuggestions({
      report: procurementReport,
      exceptions: controlExceptions
    });

    expect(suggestions.map((suggestion) => suggestion.recommendedValue)).toContain("approval");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain("open-exception-evidence");
  });

  it("adds Sales KPI-aware evidence upload suggestions", () => {
    const suggestions = getEvidenceUploadSuggestions({
      report: departmentReports.find((report) => report.department === "sales"),
      exceptions: controlExceptions,
      businessKpis
    });

    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-invoice-evidence");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain("sales-inventory-delivery-evidence");
  });

  it("keeps Analyst suggestions inside oversight boundaries", () => {
    const suggestions = getAnalystExceptionSuggestions(controlExceptions[0]);

    expect(suggestions[0]?.detail).toContain("CEO remains responsible");
    expect(suggestions.map((suggestion) => suggestion.id)).toContain(`escalate-${controlExceptions[0].id}`);
  });

  it("gives CEOs resolution-note structure for exception closure", () => {
    const suggestions = getCeoExceptionResolutionSuggestions(controlExceptions[0]);

    expect(suggestions[0]?.field).toBe("body");
    expect(suggestions[0]?.recommendedValue).toContain("Corrective action");
  });
});
