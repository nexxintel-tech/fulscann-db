export type PlatformRole = "super_admin" | "analyst" | "business_user" | "institution_user";

export type Permission =
  | "assign_analyst"
  | "view_assigned_business"
  | "view_business_dashboard"
  | "view_reports_and_evidence"
  | "comment_on_exception"
  | "request_clarification"
  | "mark_report_review_ready"
  | "escalate_issue"
  | "edit_business_data"
  | "approve_ceo_sensitive_action"
  | "share_integrity_report"
  | "delete_business_record";

const ROLE_PERMISSIONS: Record<PlatformRole, Set<Permission>> = {
  super_admin: new Set([
    "assign_analyst",
    "view_assigned_business",
    "view_business_dashboard",
    "view_reports_and_evidence",
    "comment_on_exception",
    "request_clarification",
    "mark_report_review_ready",
    "escalate_issue"
  ]),
  analyst: new Set([
    "view_assigned_business",
    "view_business_dashboard",
    "view_reports_and_evidence",
    "comment_on_exception",
    "request_clarification",
    "mark_report_review_ready",
    "escalate_issue"
  ]),
  business_user: new Set([
    "view_business_dashboard",
    "view_reports_and_evidence",
    "edit_business_data",
    "approve_ceo_sensitive_action",
    "share_integrity_report"
  ]),
  institution_user: new Set([])
};

export function hasPermission(role: PlatformRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function assertAnalystBoundary(role: PlatformRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} cannot perform ${permission}.`);
  }
}
