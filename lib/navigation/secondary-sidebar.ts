import type { AuthProfile } from "@/lib/auth/session";
import type { PlatformRole } from "@/lib/auth/roles";

export type DashboardWorkspaceContext = {
  label: string;
  value: string;
  detail?: string;
};

export type DashboardSidebarLink = {
  label: string;
  href: string;
};

export type DashboardSidebarModel = {
  profile: AuthProfile;
  roleLabel: string;
  workspace: DashboardWorkspaceContext;
  navigation: DashboardSidebarLink[];
  quickActions: DashboardSidebarLink[];
};

export function getDashboardSidebarModel(profile: AuthProfile, workspace?: Partial<DashboardWorkspaceContext>): DashboardSidebarModel {
  return {
    profile,
    roleLabel: getRoleLabel(profile.platformRole),
    workspace: {
      label: workspace?.label ?? getDefaultWorkspace(profile.platformRole).label,
      value: workspace?.value ?? getDefaultWorkspace(profile.platformRole).value,
      detail: workspace?.detail ?? getDefaultWorkspace(profile.platformRole).detail
    },
    navigation: getRoleNavigation(profile.platformRole),
    quickActions: getRoleQuickActions(profile.platformRole)
  };
}

export function getRoleLabel(role: PlatformRole) {
  if (role === "super_admin") return "Fulscann Super Admin";
  if (role === "analyst") return "Fulscann Analyst";
  if (role === "business_user") return "Business User";
  return "Institution User";
}

function getDefaultWorkspace(role: PlatformRole): DashboardWorkspaceContext {
  if (role === "super_admin") {
    return { label: "Workspace", value: "Fulscann Platform", detail: "Platform-wide oversight" };
  }

  if (role === "analyst") {
    return { label: "Workspace", value: "Assigned portfolio", detail: "Oversight and escalation" };
  }

  if (role === "institution_user") {
    return { label: "Workspace", value: "Institution access", detail: "CEO-granted report visibility" };
  }

  return { label: "Workspace", value: "Business workspace", detail: "CEO or staff business access" };
}

function getRoleNavigation(role: PlatformRole): DashboardSidebarLink[] {
  if (role === "super_admin") {
    return [
      { label: "Super Admin dashboard", href: "/dashboard/super-admin" },
      { label: "Analyst workload", href: "/dashboard/super-admin#analyst-workload" },
      { label: "Escalations", href: "/dashboard/super-admin#escalations" }
    ];
  }

  if (role === "analyst") {
    return [
      { label: "Analyst dashboard", href: "/dashboard/analyst" },
      { label: "IC review queue", href: "/dashboard/analyst#ic-review" },
      { label: "Exception actions", href: "/dashboard/analyst#exception-actions" }
    ];
  }

  if (role === "institution_user") {
    return [
      { label: "Institution dashboard", href: "/institution" },
      { label: "Approved reports", href: "/institution#approved-reports" }
    ];
  }

  return [
    { label: "CEO dashboard", href: "/dashboard/ceo" },
    { label: "Onboarding", href: "/dashboard/ceo/onboarding" },
    { label: "Staff management", href: "/dashboard/ceo/staff" },
    { label: "Staff workspace", href: "/dashboard/staff" }
  ];
}

function getRoleQuickActions(role: PlatformRole): DashboardSidebarLink[] {
  if (role === "super_admin") {
    return [
      { label: "Assign Analyst", href: "/dashboard/super-admin#assign-analyst" },
      { label: "Review escalations", href: "/dashboard/super-admin#escalations" }
    ];
  }

  if (role === "analyst") {
    return [
      { label: "Request clarification", href: "/dashboard/analyst#analyst-actions" },
      { label: "Escalate issue", href: "/dashboard/analyst#exception-actions" }
    ];
  }

  if (role === "institution_user") {
    return [{ label: "View approved reports", href: "/institution#approved-reports" }];
  }

  return [
    { label: "Continue onboarding", href: "/dashboard/ceo/onboarding" },
    { label: "Invite staff", href: "/dashboard/ceo/staff" },
    { label: "Submit staff report", href: "/dashboard/staff" }
  ];
}
