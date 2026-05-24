import { describe, expect, it } from "vitest";
import {
  DEPARTMENT_HEAD_ROLE,
  isDepartmentHeadMembership,
  isDepartmentHeadRole,
  isDepartmentMember,
  STAFF_INVITATION_ROLES
} from "@/lib/staff/roles";

describe("staff role helpers", () => {
  it("includes Departmental Head in allowed staff invitation roles", () => {
    expect(STAFF_INVITATION_ROLES).toContain(DEPARTMENT_HEAD_ROLE);
    expect(isDepartmentHeadRole("department_head")).toBe(true);
    expect(isDepartmentHeadRole("sales_officer")).toBe(false);
  });

  it("treats Departmental Head as department-scoped but not CEO", () => {
    const membership = {
      id: "bu_head",
      businessId: "biz_001",
      userId: "usr_head",
      role: "department_head",
      departmentId: "dept_001",
      status: "active" as const,
      createdAt: "2026-05-22T08:00:00.000Z"
    };

    expect(isDepartmentMember(membership)).toBe(true);
    expect(isDepartmentHeadMembership(membership)).toBe(true);
  });

  it("does not treat CEO membership as a department member", () => {
    expect(isDepartmentMember({
      id: "bu_ceo",
      businessId: "biz_001",
      userId: "usr_ceo",
      role: "ceo",
      departmentId: null,
      status: "active",
      createdAt: "2026-05-22T08:00:00.000Z"
    })).toBe(false);
  });
});
