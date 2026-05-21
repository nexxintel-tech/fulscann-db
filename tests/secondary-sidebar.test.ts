import { describe, expect, it } from "vitest";
import { getDashboardSidebarModel, getRoleLabel } from "@/lib/navigation/secondary-sidebar";
import type { AuthProfile } from "@/lib/auth/session";

describe("secondary dashboard sidebar model", () => {
  it("builds Super Admin workspace navigation", () => {
    const model = getDashboardSidebarModel(profile("super_admin"));

    expect(model.roleLabel).toBe("Fulscann Super Admin");
    expect(model.workspace.value).toBe("Fulscann Platform");
    expect(model.navigation.map((link) => link.href)).toContain("/dashboard/super-admin#analyst-workload");
    expect(model.quickActions.map((link) => link.href)).toContain("/dashboard/super-admin#assign-analyst");
  });

  it("keeps Analyst navigation scoped to oversight actions", () => {
    const model = getDashboardSidebarModel(profile("analyst"));

    expect(model.roleLabel).toBe("Fulscann Analyst");
    expect(model.navigation.map((link) => link.href)).toContain("/dashboard/analyst#exception-actions");
    expect(model.quickActions.map((link) => link.label)).not.toContain("Share report");
  });

  it("supports business and staff workspace overrides", () => {
    const model = getDashboardSidebarModel(profile("business_user"), {
      value: "Staff workspace",
      detail: "Department reporting and evidence"
    });

    expect(model.roleLabel).toBe("Business User");
    expect(model.workspace.value).toBe("Staff workspace");
    expect(model.navigation.map((link) => link.href)).toContain("/dashboard/staff");
  });

  it("maps institution users to CEO-granted report navigation", () => {
    const model = getDashboardSidebarModel(profile("institution_user"));

    expect(getRoleLabel("institution_user")).toBe("Institution User");
    expect(model.navigation.map((link) => link.href)).toContain("/institution#approved-reports");
    expect(model.quickActions).toHaveLength(1);
  });
});

function profile(platformRole: AuthProfile["platformRole"]): AuthProfile {
  return {
    id: `user_${platformRole}`,
    fullName: "Test User",
    email: `${platformRole}@example.com`,
    platformRole
  };
}
