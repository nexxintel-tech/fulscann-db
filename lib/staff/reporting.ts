import type { Department, DepartmentReport, StaffInvitation } from "@/lib/types";

export function getPendingStaffInvitations(invitations: StaffInvitation[], businessId: string) {
  return invitations.filter((invitation) => invitation.businessId === businessId && invitation.status === "pending");
}

export function getReportsForDepartment(reports: DepartmentReport[], businessId: string, departmentType: Department["departmentType"]) {
  return reports.filter((report) => report.businessId === businessId && report.department === departmentType);
}

export function getStaffAssignableDepartments(departments: Department[], businessId: string) {
  return departments.filter((department) => department.businessId === businessId);
}
