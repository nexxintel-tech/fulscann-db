import type { ReactNode } from "react";
import { DarkSidebar } from "@/components/layout/DarkSidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { DashboardSidebarLink } from "@/lib/navigation/secondary-sidebar";

type AppShellProps = {
  activeRoute?: string;
  children: ReactNode;
  navigationItems: DashboardSidebarLink[];
  quickActions?: DashboardSidebarLink[];
  roleLabel: string;
  searchPlaceholder?: string;
  sidebarFooter?: ReactNode;
  topBarActions?: ReactNode;
  userName: string;
  workspaceName: string;
  workspaceDetail?: string;
};

export function AppShell({
  activeRoute,
  children,
  navigationItems,
  quickActions,
  roleLabel,
  searchPlaceholder,
  sidebarFooter,
  topBarActions,
  userName,
  workspaceName,
  workspaceDetail
}: AppShellProps) {
  return (
    <div className="app-shell">
      <DarkSidebar
        activeRoute={activeRoute}
        footerCard={sidebarFooter}
        navigationItems={navigationItems}
        quickActions={quickActions}
        roleLabel={roleLabel}
        userName={userName}
        workspaceDetail={workspaceDetail}
        workspaceName={workspaceName}
      />
      <div className="main-workspace">
        <TopBar
          actionArea={topBarActions}
          roleLabel={roleLabel}
          searchPlaceholder={searchPlaceholder}
          userName={userName}
        />
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
