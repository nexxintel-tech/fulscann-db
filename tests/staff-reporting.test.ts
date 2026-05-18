import { describe, expect, it } from "vitest";
import {
  getPendingStaffInvitations,
  getReportsForDepartment,
  getStaffAssignableDepartments
} from "@/lib/staff/reporting";
import { departments, departmentReports, staffInvitations } from "@/lib/data/sample-data";

describe("staff reporting", () => {
  it("finds pending staff invitations for a business", () => {
    const invitations = getPendingStaffInvitations(staffInvitations, "biz_001");

    expect(invitations).toHaveLength(1);
    expect(invitations[0]?.email).toBe("sales@adenikefoods.example");
  });

  it("filters reports by assigned department", () => {
    const reports = getReportsForDepartment(departmentReports, "biz_001", "sales");

    expect(reports.map((report) => report.id)).toEqual(["rep_001"]);
  });

  it("lists departments available for staff assignment", () => {
    const assignableDepartments = getStaffAssignableDepartments(departments, "biz_001");

    expect(assignableDepartments.map((department) => department.departmentType)).toEqual(["sales", "finance"]);
  });
});
