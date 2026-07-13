import { describe, expect, it } from "vitest";
import {
  buildPasswordResetRedirect,
  buildSignupEmailRedirect,
  getCanonicalAppOrigin,
  getSafeAuthCallbackNextPath,
  parsePasswordResetEmail,
  updatePasswordSchema
} from "@/lib/auth/password-reset";

describe("password reset policy", () => {
  it("normalizes password reset request email", () => {
    const formData = new FormData();
    formData.set("email", "  CEO@Example.COM ");

    expect(parsePasswordResetEmail(formData.get("email"))).toBe("ceo@example.com");
  });

  it("rejects invalid password reset request email", () => {
    expect(parsePasswordResetEmail("not-an-email")).toBeNull();
  });

  it("builds reset links directly to the password reset route", () => {
    expect(buildPasswordResetRedirect("https://verilab.fulscann.com/")).toBe(
      "https://verilab.fulscann.com/reset-password"
    );
  });

  it("builds signup confirmation links through the auth callback route", () => {
    expect(buildSignupEmailRedirect("https://verilab.fulscann.com/")).toBe(
      "https://verilab.fulscann.com/auth/callback?next=/dashboard/ceo/onboarding"
    );
  });

  it("allows only expected auth callback destinations", () => {
    expect(getSafeAuthCallbackNextPath("/reset-password")).toBe("/reset-password");
    expect(getSafeAuthCallbackNextPath("/dashboard/ceo/onboarding")).toBe("/dashboard/ceo/onboarding");
  });

  it("rejects external and unexpected auth callback destinations", () => {
    expect(getSafeAuthCallbackNextPath("https://evil.example")).toBe("/reset-password");
    expect(getSafeAuthCallbackNextPath("//evil.example")).toBe("/reset-password");
    expect(getSafeAuthCallbackNextPath("/dashboard/super-admin")).toBe("/reset-password");
    expect(getSafeAuthCallbackNextPath("/login?reset=password-updated")).toBe("/reset-password");
    expect(getSafeAuthCallbackNextPath(null)).toBe("/reset-password");
  });

  it("prefers configured app origin over request header fallback", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://verilab.fulscann.com/";

    expect(getCanonicalAppOrigin("http://localhost:3000")).toBe("https://verilab.fulscann.com");

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("requires matching reset passwords of at least 8 characters", () => {
    expect(
      updatePasswordSchema.safeParse({
        password: "new-password",
        confirmPassword: "new-password"
      }).success
    ).toBe(true);

    expect(
      updatePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short"
      }).success
    ).toBe(false);

    expect(
      updatePasswordSchema.safeParse({
        password: "new-password",
        confirmPassword: "different-password"
      }).success
    ).toBe(false);
  });
});
