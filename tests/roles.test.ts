import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/roles";

describe("role permissions", () => {
  it("keeps analyst permissions inside oversight boundaries", () => {
    expect(hasPermission("analyst", "view_assigned_business")).toBe(true);
    expect(hasPermission("analyst", "comment_on_exception")).toBe(true);
    expect(hasPermission("analyst", "request_clarification")).toBe(true);
    expect(hasPermission("analyst", "mark_report_review_ready")).toBe(true);
    expect(hasPermission("analyst", "escalate_issue")).toBe(true);
    expect(hasPermission("analyst", "edit_business_data")).toBe(false);
    expect(hasPermission("analyst", "approve_ceo_sensitive_action")).toBe(false);
    expect(hasPermission("analyst", "share_integrity_report")).toBe(false);
    expect(hasPermission("analyst", "delete_business_record")).toBe(false);
  });

  it("keeps Integrity Report sharing with business users", () => {
    expect(hasPermission("business_user", "share_integrity_report")).toBe(true);
    expect(hasPermission("institution_user", "share_integrity_report")).toBe(false);
  });
});
