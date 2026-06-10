import type { ReactNode } from "react";

type TopBarProps = {
  actionArea?: ReactNode;
  roleLabel: string;
  searchPlaceholder?: string;
  userName: string;
};

export function TopBar({
  actionArea,
  roleLabel,
  searchPlaceholder = "Search businesses, reports, signals...",
  userName
}: TopBarProps) {
  return (
    <header className="workspace-topbar">
      <a className="topbar-menu-button" href="#app-sidebar" aria-label="Open navigation">Menu</a>
      <label className="workspace-search">
        <span className="sr-only">Search workspace</span>
        <input placeholder={searchPlaceholder} type="search" />
      </label>
      <div className="topbar-actions">
        {actionArea}
        <button className="icon-button" type="button" aria-label="Notifications">N</button>
        <button className="icon-button" type="button" aria-label="Help">?</button>
        <div className="topbar-profile">
          <div className="avatar compact" aria-hidden="true">{getInitials(userName)}</div>
          <div>
            <strong>{userName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
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
