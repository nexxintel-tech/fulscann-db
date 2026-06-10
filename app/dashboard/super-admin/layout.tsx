import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth/session";
import { getDashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export default async function SuperAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await requireRole(["super_admin"]);
  const sidebarModel = getDashboardSidebarModel(profile);

  return (
    <AppShell
      activeRoute="/dashboard/super-admin"
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
