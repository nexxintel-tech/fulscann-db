import type { BusinessUser, StaffInvitation } from "@/lib/types";

export function findStaffInvitationByToken(invitations: StaffInvitation[], token: string) {
  return invitations.find((invitation) => invitation.invitationToken === token) ?? null;
}

export function canAcceptStaffInvitation(invitation: StaffInvitation | null, email: string) {
  if (!invitation || invitation.status !== "pending") {
    return false;
  }

  return invitation.email.toLowerCase() === email.toLowerCase();
}

export function getActiveStaffMembership(memberships: BusinessUser[], userId?: string) {
  const activeStaff = memberships.filter(
    (membership) => membership.status === "active" && membership.role !== "ceo" && Boolean(membership.departmentId)
  );

  if (!userId) {
    return activeStaff[0] ?? null;
  }

  return activeStaff.find((membership) => membership.userId === userId) ?? null;
}
