import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/session";
import { getBusinessAccessContext, isStaffOnlyBusinessUser } from "@/lib/auth/business-access";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getDashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export default async function CeoLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await requireRole(["business_user"]);
  const { businesses, businessUsers, departments } = await getPlatformSnapshot();
  const businessContext = getBusinessAccessContext({
    memberships: businessUsers,
    businesses,
    departments,
    userId: profile.id
  });

  if (isStaffOnlyBusinessUser(businessContext)) {
    redirect("/dashboard/staff");
  }

  const workspace = businessContext.business
    ? { value: businessContext.business.legalName, detail: "CEO-owned business control center" }
    : { value: "Business onboarding", detail: "Create the first business profile" };
  const sidebarModel = getDashboardSidebarModel(profile, workspace, businessContext.persona);

  return (
    <AppShell
      activeRoute="/dashboard/ceo"
      navigationItems={sidebarModel.navigation}
      quickActions={sidebarModel.quickActions}
      roleLabel={sidebarModel.roleLabel}
      userName={sidebarModel.profile.fullName}
      workspaceDetail={sidebarModel.workspace.detail}
      workspaceName={sidebarModel.workspace.value}
    >
      {children}
    </AppShell>
  );
}
