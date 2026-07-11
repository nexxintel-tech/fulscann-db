import { describe, expect, it } from "vitest";
import {
  buildPasswordResetRedirect,
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

  it("builds reset links through the auth callback route", () => {
    expect(buildPasswordResetRedirect("https://verilab.fulscann.com")).toBe(
      "https://verilab.fulscann.com/auth/callback?next=/reset-password"
    );
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
