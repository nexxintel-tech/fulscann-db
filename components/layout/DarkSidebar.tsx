import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/login/actions";
import type { DashboardSidebarLink } from "@/lib/navigation/secondary-sidebar";

type DarkSidebarProps = {
  activeRoute?: string;
  navigationItems: DashboardSidebarLink[];
  quickActions?: DashboardSidebarLink[];
  roleLabel: string;
  userName: string;
  workspaceName: string;
  workspaceDetail?: string;
  footerCard?: ReactNode;
};

export function DarkSidebar({
  activeRoute,
  footerCard,
  navigationItems,
  quickActions = [],
  roleLabel,
  userName,
  workspaceName,
  workspaceDetail
}: DarkSidebarProps) {
  return (
    <aside className="dark-sidebar" id="app-sidebar" aria-label="Role navigation">
      <section className="sidebar-brand-panel">
        <span className="sidebar-brand-mark" aria-hidden="true" />
        <div>
          <strong>Fulscann-DB</strong>
          <span>Trust. Risk. Readiness. Ranking.</span>
        </div>
      </section>

      <section className="sidebar-user-card">
        <div className="avatar" aria-hidden="true">{getInitials(userName)}</div>
        <div>
          <strong>{userName}</strong>
          <span>{roleLabel}</span>
        </div>
      </section>

      <section className="sidebar-workspace-card">
        <h2>Workspace</h2>
        <strong>{workspaceName}</strong>
        {workspaceDetail ? <p>{workspaceDetail}</p> : null}
      </section>

      <SidebarLinkGroup title="Navigation" links={navigationItems} activeRoute={activeRoute} />
      {quickActions.length > 0 ? <SidebarLinkGroup title="Quick actions" links={quickActions} activeRoute={activeRoute} /> : null}

      {footerCard ?? (
        <section className="sidebar-trust-card">
          <strong>Trust intelligence</strong>
          <span>Role-bound access keeps approvals, controls, and external visibility separated.</span>
        </section>
      )}

      <section className="sidebar-section account-actions">
        <h2>Support</h2>
        <Link href="/login">Settings</Link>
        <Link href="/help/getting-started">Help center</Link>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </section>
    </aside>
  );
}

function SidebarLinkGroup({ activeRoute, links, title }: { activeRoute?: string; links: DashboardSidebarLink[]; title: string }) {
  return (
    <section className="sidebar-section sidebar-links">
      <h2>{title}</h2>
      {links.map((link) => {
        const baseHref = link.href.split("#")[0];
        const isActive = activeRoute ? baseHref === activeRoute : false;

        return (
          <a className={isActive ? "active" : undefined} key={`${title}-${link.href}-${link.label}`} href={link.href}>
            {link.label}
          </a>
        );
      })}
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "FS";
}
