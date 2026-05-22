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

  it("supports CEO workspace navigation for CEO business users", () => {
    const model = getDashboardSidebarModel(profile("business_user"), {
      value: "Business control center",
      detail: "CEO-owned business access"
    }, "ceo");

    expect(model.roleLabel).toBe("Business CEO");
    expect(model.navigation.map((link) => link.href)).toContain("/dashboard/ceo");
    expect(model.quickActions.map((link) => link.href)).toContain("/dashboard/ceo#integrity-report-sharing");
  });

  it("keeps staff users out of CEO navigation", () => {
    const model = getDashboardSidebarModel(profile("business_user"), {
      value: "Staff workspace",
      detail: "Department reporting and evidence"
    }, "staff");

    const allLabels = [...model.navigation, ...model.quickActions].map((link) => link.label);
    const allHrefs = [...model.navigation, ...model.quickActions].map((link) => link.href);

    expect(model.roleLabel).toBe("Staff");
    expect(model.workspace.value).toBe("Staff workspace");
    expect(allHrefs).toContain("/dashboard/staff#upload-evidence");
    expect(allLabels).not.toContain("CEO dashboard");
    expect(allLabels).not.toContain("Onboarding");
    expect(allLabels).not.toContain("Staff management");
    expect(allLabels).not.toContain("Invite staff");
    expect(allLabels).not.toContain("Share Integrity Report");
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
