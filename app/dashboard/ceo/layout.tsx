import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SecondarySidebar } from "@/components/dashboard/secondary-sidebar";
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

  return (
    <div className="dashboard-shell">
      <SecondarySidebar model={getDashboardSidebarModel(profile, workspace, businessContext.persona)} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
