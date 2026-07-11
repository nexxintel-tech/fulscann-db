import { describe, expect, it } from "vitest";
import {
  canSelfRegisterRole,
  getSelfServiceSignupRole,
  normalizeAuthEmail,
  normalizeSignupEmail
} from "@/lib/auth/signup";

describe("self-service signup policy", () => {
  it("allows only Business CEO accounts to self-register", () => {
    expect(getSelfServiceSignupRole()).toBe("business_user");
    expect(canSelfRegisterRole("business_user")).toBe(true);
    expect(canSelfRegisterRole("analyst")).toBe(false);
    expect(canSelfRegisterRole("super_admin")).toBe(false);
    expect(canSelfRegisterRole("institution_user")).toBe(false);
  });

  it("normalizes account emails before Auth/profile creation", () => {
    expect(normalizeSignupEmail("  CEO@Example.COM ")).toBe("ceo@example.com");
    expect(normalizeAuthEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});
