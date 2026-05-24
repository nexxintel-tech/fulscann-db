import { describe, expect, it } from "vitest";
import {
  canDepartmentHeadViewKpiGaps,
  canSubmitKpiReportForDepartment,
  getIncompleteDepartmentKpis,
  hasRawKpiEvidenceAccessForInstitution
} from "@/lib/kpis/business-kpis";
import { businessKpis, businessUsers, departments, departmentReports } from "@/lib/data/sample-data";

describe("business KPI permissions and completion", () => {
  const salesDepartment = departments.find((department) => department.departmentType === "sales")!;
  const salesKpi = businessKpis.find((kpi) => kpi.kpiKey === "monthly_sales_value")!;

  it("allows staff to submit KPI data only for the assigned department", () => {
    const salesStaff = businessUsers.find((user) => user.userId === "usr_staff_001")!;
    const otherDepartment = { ...salesDepartment, id: "dept_finance", departmentType: "finance" as const };

    expect(canSubmitKpiReportForDepartment({ membership: salesStaff, department: salesDepartment, kpi: salesKpi })).toBe(true);
    expect(canSubmitKpiReportForDepartment({ membership: salesStaff, department: otherDepartment, kpi: salesKpi })).toBe(false);
  });

  it("allows Departmental Head KPI gap visibility only for assigned department", () => {
    const departmentHead = {
      id: "bu_head",
      businessId: "biz_001",
      userId: "usr_head",
      role: "department_head",
      departmentId: "dept_001",
      status: "active" as const,
      createdAt: "2026-05-23T08:00:00.000Z"
    };
    const unrelatedKpi = { ...salesKpi, departmentId: "dept_002" };

    expect(canDepartmentHeadViewKpiGaps({ membership: departmentHead, department: salesDepartment, kpi: salesKpi })).toBe(true);
    expect(canDepartmentHeadViewKpiGaps({ membership: departmentHead, department: salesDepartment, kpi: unrelatedKpi })).toBe(false);
  });

  it("calculates incomplete department KPI gaps from linked reports", () => {
    const incomplete = getIncompleteDepartmentKpis({
      businessKpis,
      reports: departmentReports.filter((report) => report.businessId === "biz_001" && report.department === "sales")
    });

    expect(incomplete.length).toBeGreaterThan(0);
    expect(incomplete.map((kpi) => kpi.kpiKey)).toContain("sales_to_finance_match_rate");
  });

  it("does not allow institutions to access raw KPI evidence by default", () => {
    expect(hasRawKpiEvidenceAccessForInstitution()).toBe(false);
  });
});
