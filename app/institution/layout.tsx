import type { ReactNode } from "react";
import { SecondarySidebar } from "@/components/dashboard/secondary-sidebar";
import { requireRole } from "@/lib/auth/session";
import { getDashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export default async function InstitutionLayout({ children }: Readonly<{ children: ReactNode }>) {
  const profile = await requireRole(["institution_user"]);
  return (
    <div className="dashboard-shell">
      <SecondarySidebar model={getDashboardSidebarModel(profile)} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
