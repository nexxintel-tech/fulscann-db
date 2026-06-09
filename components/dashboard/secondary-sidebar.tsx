import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { DashboardSidebarModel } from "@/lib/navigation/secondary-sidebar";

export function SecondarySidebar({ model, currentPath }: { model: DashboardSidebarModel; currentPath?: string }) {
  return (
    <aside className="secondary-sidebar" aria-label="Dashboard profile and navigation">
      <section className="sidebar-section profile-block">
        <div className="avatar" aria-hidden="true">{getInitials(model.profile.fullName)}</div>
        <div>
          <strong>{model.profile.fullName}</strong>
          <span>{model.profile.email}</span>
        </div>
        <span className="role-badge">{model.roleLabel}</span>
      </section>

      <section className="sidebar-section">
        <h2>{model.workspace.label}</h2>
        <strong>{model.workspace.value}</strong>
        {model.workspace.detail ? <p>{model.workspace.detail}</p> : null}
      </section>

      <SidebarLinks title="Navigation" links={model.navigation} currentPath={currentPath} />
      <SidebarLinks title="Quick actions" links={model.quickActions} currentPath={currentPath} />

      <section className="sidebar-trust-card">
        <strong>Trust intelligence</strong>
        <span>CEO-owned approvals, analyst oversight, and control signals stay role-bound.</span>
      </section>

      <section className="sidebar-section account-actions">
        <h2>Account</h2>
        <Link href="/login">Profile</Link>
        <Link href="/login">Settings</Link>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </section>
    </aside>
  );
}

function SidebarLinks({ title, links, currentPath }: { title: string; links: { label: string; href: string }[]; currentPath?: string }) {
  return (
    <section className="sidebar-section sidebar-links">
      <h2>{title}</h2>
      {links.map((link) => {
        const baseHref = link.href.split("#")[0];
        const isActive = currentPath ? baseHref === currentPath : false;

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
