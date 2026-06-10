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
  if (role === "business_user" && businessPersona === "department_head") return "Departmental Head";
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

  if (role === "department_head") {
    return { label: "Workspace", value: "Department workspace", detail: "Departmental compliance coordination" };
  }

  if (role === "staff") {
    return { label: "Workspace", value: "Staff workspace", detail: "Assigned department reporting" };
  }

  return { label: "Workspace", value: "Business control center", detail: "CEO-owned business access" };
}

function getRoleNavigation(role: SidebarRoleKey): DashboardSidebarLink[] {
  if (role === "super_admin") {
    return [
      { label: "Dashboard", href: "/dashboard/super-admin" },
      { label: "Platform Risk", href: "/dashboard/super-admin#escalations" },
      { label: "Analysts", href: "/dashboard/super-admin#analyst-workload" },
      { label: "Business Assignments", href: "/dashboard/super-admin#assign-analyst" },
      { label: "Escalations", href: "/dashboard/super-admin#escalations" },
      { label: "Settings", href: "/login" }
    ];
  }

  if (role === "analyst") {
    return [
      { label: "Dashboard", href: "/dashboard/analyst" },
      { label: "Assigned Businesses", href: "/dashboard/analyst#analyst-actions" },
      { label: "Review Queue", href: "/dashboard/analyst#ic-review" },
      { label: "Clarifications", href: "/dashboard/analyst#analyst-actions" },
      { label: "Escalations", href: "/dashboard/analyst#exception-actions" },
      { label: "Settings", href: "/login" }
    ];
  }

  if (role === "institution_user") {
    return [
      { label: "Dashboard", href: "/institution" },
      { label: "Approved Reports", href: "/institution#approved-reports" },
      { label: "Risk Signals", href: "/institution#risk-signals" },
      { label: "Businesses", href: "/institution#approved-reports" },
      { label: "Access History", href: "/institution#access-history" },
      { label: "Settings", href: "/login" }
    ];
  }

  if (role === "department_head") {
    return [
      { label: "Dashboard", href: "/dashboard/staff" },
      { label: "Department Reports", href: "/dashboard/staff#department-reports" },
      { label: "Evidence Gaps", href: "/dashboard/staff#missing-evidence" },
      { label: "Corrections", href: "/dashboard/staff#returned-corrections" },
      { label: "Team Compliance", href: "/dashboard/staff#staff-compliance" },
      { label: "Department Issues", href: "/dashboard/staff#department-ic-issues" },
      { label: "Settings", href: "/login" }
    ];
  }

  if (role === "staff") {
    return [
      { label: "Dashboard", href: "/dashboard/staff" },
      { label: "Submit Report", href: "/dashboard/staff#submit-report" },
      { label: "Evidence", href: "/dashboard/staff#upload-evidence" },
      { label: "Corrections", href: "/dashboard/staff#returned-corrections" },
      { label: "Department Issues", href: "/dashboard/staff#department-ic-issues" },
      { label: "Settings", href: "/login" }
    ];
  }

  return [
    { label: "Dashboard", href: "/dashboard/ceo" },
    { label: "Onboarding", href: "/dashboard/ceo/onboarding" },
    { label: "KPIs & Departments", href: "/dashboard/ceo/onboarding" },
    { label: "Staff", href: "/dashboard/ceo/staff" },
    { label: "IC Issues", href: "/dashboard/ceo#integrity-report-sharing" },
    { label: "Integrity Report", href: "/dashboard/ceo#integrity-report-sharing" },
    { label: "Settings", href: "/login" }
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

  if (role === "department_head") {
    return [
      { label: "Request correction", href: "/dashboard/staff#department-head-actions" },
      { label: "Mark ready for review", href: "/dashboard/staff#ready-for-review" },
      { label: "Escalate to CEO", href: "/dashboard/staff#department-head-actions" }
    ];
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
