import { describe, expect, it } from "vitest";
import { getBusinessAccessContext, isStaffOnlyBusinessUser } from "@/lib/auth/business-access";
import { businesses, businessUsers, departments } from "@/lib/data/sample-data";

describe("business access context", () => {
  it("identifies CEO membership separately from platform business_user", () => {
    const context = getBusinessAccessContext({
      memberships: businessUsers,
      businesses,
      departments,
      userId: "usr_ceo_001"
    });

    expect(context.persona).toBe("ceo");
    expect(context.business?.id).toBe("biz_001");
    expect(isStaffOnlyBusinessUser(context)).toBe(false);
  });

  it("identifies staff by non-CEO membership and department assignment", () => {
    const context = getBusinessAccessContext({
      memberships: businessUsers,
      businesses,
      departments,
      userId: "usr_staff_001"
    });

    expect(context.persona).toBe("staff");
    expect(context.department?.departmentType).toBe("sales");
    expect(isStaffOnlyBusinessUser(context)).toBe(true);
  });

  it("keeps new business users in onboarding until membership exists", () => {
    const context = getBusinessAccessContext({
      memberships: businessUsers,
      businesses,
      departments,
      userId: "new_business_user"
    });

    expect(context.persona).toBe("business_onboarding");
    expect(context.membership).toBeNull();
  });
});
