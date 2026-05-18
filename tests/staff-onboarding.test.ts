import { describe, expect, it } from "vitest";
import {
  canAcceptStaffInvitation,
  findStaffInvitationByToken,
  getActiveStaffMembership
} from "@/lib/staff/onboarding";
import { businessUsers, staffInvitations } from "@/lib/data/sample-data";

describe("staff onboarding", () => {
  it("finds invitations by token", () => {
    const invitation = findStaffInvitationByToken(staffInvitations, "demo-sales-invite");

    expect(invitation?.email).toBe("sales@adenikefoods.example");
  });

  it("allows only the invited email to accept a pending invitation", () => {
    const invitation = findStaffInvitationByToken(staffInvitations, "demo-sales-invite");

    expect(canAcceptStaffInvitation(invitation, "SALES@ADENIKEFOODS.EXAMPLE")).toBe(true);
    expect(canAcceptStaffInvitation(invitation, "other@example.com")).toBe(false);
  });

  it("selects an active non-CEO staff membership", () => {
    const membership = getActiveStaffMembership(businessUsers, "usr_staff_001");

    expect(membership?.role).toBe("sales_officer");
    expect(membership?.departmentId).toBe("dept_001");
  });
});
