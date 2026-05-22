import type { AuthProfile } from "@/lib/auth/session";
import type { PlatformRole } from "@/lib/auth/roles";
import type { BusinessAccessPersona } from "@/lib/auth/business-access";

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

export function getDashboardSidebarModel(
  profile: AuthProfile,
  workspace?: Partial<DashboardWorkspaceContext>,
  businessPersona?: BusinessAccessPersona
): DashboardSidebarModel {
  const roleKey = getSidebarRoleKey(profile.platformRole, businessPersona);

  return {
    profile,
    roleLabel: getRoleLabel(profile.platformRole, businessPersona),
    workspace: {
      label: workspace?.label ?? getDefaultWorkspace(roleKey).label,
      value: workspace?.value ?? getDefaultWorkspace(roleKey).value,
      detail: workspace?.detail ?? getDefaultWorkspace(roleKey).detail
    },
    navigation: getRoleNavigation(roleKey),
    quickActions: getRoleQuickActions(roleKey)
  };
}

type SidebarRoleKey = PlatformRole | BusinessAccessPersona;

export function getRoleLabel(role: PlatformRole, businessPersona?: BusinessAccessPersona) {
  if (role === "super_admin") return "Fulscann Super Admin";
  if (role === "analyst") return "Fulscann Analyst";
  if (role === "business_user" && businessPersona === "staff") return "Staff";
  if (role === "business_user") return "Business CEO";
  return "Institution User";
}

function getSidebarRoleKey(role: PlatformRole, businessPersona?: BusinessAccessPersona): SidebarRoleKey {
  if (role === "business_user") return businessPersona ?? "business_onboarding";
  return role;
}

function getDefaultWorkspace(role: SidebarRoleKey): DashboardWorkspaceContext {
  if (role === "super_admin") {
    return { label: "Workspace", value: "Fulscann Platform", detail: "Platform-wide oversight" };
  }

  if (role === "analyst") {
    return { label: "Workspace", value: "Assigned portfolio", detail: "Oversight and escalation" };
  }

  if (role === "institution_user") {
    return { label: "Workspace", value: "Institution access", detail: "CEO-granted report visibility" };
  }

  if (role === "staff") {
    return { label: "Workspace", value: "Staff workspace", detail: "Assigned department reporting" };
  }

  return { label: "Workspace", value: "Business control center", detail: "CEO-owned business access" };
}

function getRoleNavigation(role: SidebarRoleKey): DashboardSidebarLink[] {
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

  if (role === "staff") {
    return [
      { label: "Staff workspace", href: "/dashboard/staff" },
      { label: "Submit department report", href: "/dashboard/staff#submit-report" },
      { label: "Upload evidence", href: "/dashboard/staff#upload-evidence" },
      { label: "Returned corrections", href: "/dashboard/staff#returned-corrections" },
      { label: "Department IC issues", href: "/dashboard/staff#department-ic-issues" },
      { label: "Suggestions", href: "/dashboard/staff#staff-suggestions" }
    ];
  }

  return [
    { label: "CEO dashboard", href: "/dashboard/ceo" },
    { label: "Onboarding", href: "/dashboard/ceo/onboarding" },
    { label: "Staff management", href: "/dashboard/ceo/staff" },
    { label: "Integrity Report sharing", href: "/dashboard/ceo#integrity-report-sharing" }
  ];
}

function getRoleQuickActions(role: SidebarRoleKey): DashboardSidebarLink[] {
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

  if (role === "staff") {
    return [
      { label: "Submit department report", href: "/dashboard/staff#submit-report" },
      { label: "Upload evidence", href: "/dashboard/staff#upload-evidence" },
      { label: "View suggestions", href: "/dashboard/staff#staff-suggestions" }
    ];
  }

  return [
    { label: "Continue onboarding", href: "/dashboard/ceo/onboarding" },
    { label: "Invite staff", href: "/dashboard/ceo/staff" },
    { label: "Share Integrity Report", href: "/dashboard/ceo#integrity-report-sharing" }
  ];
}
