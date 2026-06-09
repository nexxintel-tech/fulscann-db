import type { ReactNode } from "react";
import { SecondarySidebar } from "@/components/dashboard/secondary-sidebar";
import { requireRole } from "@/lib/auth/session";
import { getDashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export default async function SuperAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await requireRole(["super_admin"]);
  return (
    <div className="dashboard-shell">
      <SecondarySidebar model={getDashboardSidebarModel(profile)} currentPath="/dashboard/super-admin" />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
