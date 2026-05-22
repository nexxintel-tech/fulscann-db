import type { Business, BusinessUser, Department } from "@/lib/types";

export type BusinessAccessPersona = "ceo" | "staff" | "business_onboarding";

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
  const staffMembership = activeMemberships.find(
    (membership) => membership.role !== "ceo" && Boolean(membership.departmentId)
  ) ?? null;
  const membership = ceoMembership ?? staffMembership;
  const business = membership
    ? input.businesses.find((item) => item.id === membership.businessId) ?? null
    : null;
  const department = staffMembership?.departmentId
    ? input.departments.find((item) => item.id === staffMembership.departmentId) ?? null
    : null;

  if (ceoMembership) {
    return { persona: "ceo", membership: ceoMembership, business, department: null };
  }

  if (staffMembership) {
    return { persona: "staff", membership: staffMembership, business, department };
  }

  return { persona: "business_onboarding", membership: null, business: null, department: null };
}

export function isStaffOnlyBusinessUser(context: BusinessAccessContext) {
  return context.persona === "staff";
}
