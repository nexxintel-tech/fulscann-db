import { describe, expect, it } from "vitest";
import { getDefaultRouteForRole, mapProfile } from "@/lib/auth/session";
import { getAllowedRolesForPath } from "@/lib/auth/route-policy";

describe("auth route policy", () => {
  it("maps protected routes to the correct roles", () => {
    expect(getAllowedRolesForPath("/dashboard/super-admin")).toEqual(["super_admin"]);
    expect(getAllowedRolesForPath("/dashboard/analyst")).toEqual(["analyst"]);
    expect(getAllowedRolesForPath("/dashboard/ceo")).toEqual(["business_user"]);
    expect(getAllowedRolesForPath("/dashboard/staff")).toEqual(["business_user"]);
    expect(getAllowedRolesForPath("/institution")).toEqual(["institution_user"]);
  });

  it("maps roles to default dashboards", () => {
    expect(getDefaultRouteForRole("super_admin")).toBe("/dashboard/super-admin");
    expect(getDefaultRouteForRole("analyst")).toBe("/dashboard/analyst");
    expect(getDefaultRouteForRole("business_user")).toBe("/dashboard/ceo");
    expect(getDefaultRouteForRole("institution_user")).toBe("/institution");
  });

  it("maps database profile rows into app profile objects", () => {
    const profile = mapProfile({
      id: "user_1",
      full_name: "Fulscann Analyst",
      email: "analyst@fulscann.com",
      platform_role: "analyst"
    });

    expect(profile).toEqual({
      id: "user_1",
      fullName: "Fulscann Analyst",
      email: "analyst@fulscann.com",
      platformRole: "analyst"
    });
  });
});
