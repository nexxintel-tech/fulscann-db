import type { PlatformRole } from "@/lib/auth/roles";

const SELF_SERVICE_SIGNUP_ROLE: PlatformRole = "business_user";

export function getSelfServiceSignupRole(): PlatformRole {
  return SELF_SERVICE_SIGNUP_ROLE;
}

export function canSelfRegisterRole(role: PlatformRole) {
  return role === SELF_SERVICE_SIGNUP_ROLE;
}

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeSignupEmail(email: string) {
  return normalizeAuthEmail(email);
}
