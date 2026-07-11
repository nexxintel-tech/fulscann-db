import { z } from "zod";
import { normalizeAuthEmail } from "@/lib/auth/signup";

export type PasswordResetErrorCode =
  | "invalid-email"
  | "invalid-reset-password"
  | "reset-email-failed"
  | "reset-session-failed"
  | "update-password-failed";

export const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine((input) => input.password === input.confirmPassword, {
  message: "Passwords must match.",
  path: ["confirmPassword"]
});

export function parsePasswordResetEmail(email: FormDataEntryValue | null) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: typeof email === "string" ? normalizeAuthEmail(email) : email
  });

  return parsed.success ? parsed.data.email : null;
}

export function buildPasswordResetRedirect(origin: string) {
  return `${origin}/auth/callback?next=/reset-password`;
}
