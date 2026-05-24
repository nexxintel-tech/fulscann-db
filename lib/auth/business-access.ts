import type { Business, BusinessUser, Department } from "@/lib/types";
import { isDepartmentHeadMembership, isDepartmentMember } from "@/lib/staff/roles";

export type BusinessAccessPersona = "ceo" | "department_head" | "staff" | "business_onboarding";

export type BusinessAccessContext = {
  persona: BusinessAccessPersona;
  membership: BusinessUser | null;
  business: Business | null;
  department: Department | null;
};

export function getBusinessAccessContext(input: {
  memberships: BusinessUser[];
  businesses: Business[];
  departments: Department[];
  userId?: string;
}): BusinessAccessContext {
  const activeMemberships = input.memberships.filter(
    (membership) => membership.status === "active" && (!input.userId || membership.userId === input.userId)
  );
  const ceoMembership = activeMemberships.find((membership) => membership.role === "ceo") ?? null;
  const departmentHeadMembership = activeMemberships.find(isDepartmentHeadMembership) ?? null;
  const staffMembership = activeMemberships.find(
    (membership) => isDepartmentMember(membership) && !isDepartmentHeadMembership(membership)
  ) ?? null;
  const departmentMembership = departmentHeadMembership ?? staffMembership;
  const membership = ceoMembership ?? departmentMembership;
  const business = membership
    ? input.businesses.find((item) => item.id === membership.businessId) ?? null
    : null;
  const department = departmentMembership?.departmentId
    ? input.departments.find((item) => item.id === departmentMembership.departmentId) ?? null
    : null;

  if (ceoMembership) {
    return { persona: "ceo", membership: ceoMembership, business, department: null };
  }

  if (departmentHeadMembership) {
    return { persona: "department_head", membership: departmentHeadMembership, business, department };
  }

  if (departmentMembership) {
    return { persona: "staff", membership: departmentMembership, business, department };
  }

  return { persona: "business_onboarding", membership: null, business: null, department: null };
}

export function isStaffOnlyBusinessUser(context: BusinessAccessContext) {
  return context.persona === "staff" || context.persona === "department_head";
}

export function isDepartmentHeadBusinessUser(context: BusinessAccessContext) {
  return context.persona === "department_head";
}
