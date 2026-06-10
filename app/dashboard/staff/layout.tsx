import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/session";
import { getBusinessAccessContext } from "@/lib/auth/business-access";
import { getPlatformSnapshot } from "@/lib/data/repository";
import { getDashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export default async function StaffLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await requireRole(["business_user"]);
  const { businesses, businessUsers, departments } = await getPlatformSnapshot();
  const businessContext = getBusinessAccessContext({
    memberships: businessUsers,
    businesses,
    departments,
    userId: profile.id
  });

  if (businessContext.persona !== "staff" && businessContext.persona !== "department_head") {
    redirect("/dashboard/ceo");
  }

  const workspace = {
    value: businessContext.business?.legalName ?? "Assigned business",
    detail: businessContext.department
      ? `Department: ${businessContext.department.name}`
      : "Assigned department reporting"
  };
  const sidebarModel = getDashboardSidebarModel(profile, workspace, businessContext.persona);

  return (
    <AppShell
      activeRoute="/dashboard/staff"
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
