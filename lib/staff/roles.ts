import type { BusinessUser } from "@/lib/types";

export const DEPARTMENT_HEAD_ROLE = "department_head";

export const STAFF_INVITATION_ROLES = [
  "sales_officer",
  "finance_officer",
  "procurement_officer",
  "operations_officer",
  "hr_admin",
  DEPARTMENT_HEAD_ROLE
] as const;

export type StaffInvitationRole = (typeof STAFF_INVITATION_ROLES)[number];

export function isDepartmentHeadRole(role?: string | null) {
  return role === DEPARTMENT_HEAD_ROLE;
}

export function isDepartmentMember(membership: BusinessUser | null | undefined) {
  return Boolean(membership?.departmentId && membership.status === "active" && membership.role !== "ceo");
}

export function isDepartmentHeadMembership(membership: BusinessUser | null | undefined) {
  return isDepartmentMember(membership) && isDepartmentHeadRole(membership?.role);
}
