import { canSelfRegisterRole, getSelfServiceSignupRole, normalizeAuthEmail } from "@/lib/auth/signup";
import type { PlatformRole } from "@/lib/auth/roles";

export type LoginErrorCode =
  | "create-account-failed"
  | "invalid-create-account"
  | "missing-profile"
  | "profile-create-failed"
  | "profile-recovery-failed"
  | "profile-recovery-unavailable"
  | "server-config";

type AuthMetadata = {
  full_name?: unknown;
  name?: unknown;
  platform_role?: unknown;
};

export type RecoverableAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: AuthMetadata | null;
};

export type ProfilePayload = {
  id: string;
  email: string;
  full_name: string;
  platform_role: PlatformRole;
};

type ProfileUpsertClient = {
  from(table: "profiles"): {
    upsert(payload: ProfilePayload): PromiseLike<{ error: unknown | null }>;
  };
};

export function getStableSignupErrorCode(error: unknown): LoginErrorCode {
  if (!error) {
    return "create-account-failed";
  }

  return "create-account-failed";
}

export function buildRecoverableProfilePayload(user: RecoverableAuthUser): ProfilePayload | null {
  const role = getRecoverableProfileRole(user.user_metadata?.platform_role);

  if (!role || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: normalizeAuthEmail(user.email),
    full_name: getRecoverableFullName(user.user_metadata),
    platform_role: role
  };
}

export async function upsertProfile(
  client: ProfileUpsertClient,
  payload: ProfilePayload
): Promise<LoginErrorCode | null> {
  const { error } = await client.from("profiles").upsert(payload);
  return error ? "profile-create-failed" : null;
}

export async function recoverProfile(
  client: ProfileUpsertClient,
  user: RecoverableAuthUser
): Promise<LoginErrorCode | null> {
  const payload = buildRecoverableProfilePayload(user);

  if (!payload) {
    return "profile-recovery-unavailable";
  }

  const { error } = await client.from("profiles").upsert(payload);
  return error ? "profile-recovery-failed" : null;
}

function getRecoverableProfileRole(role: unknown): PlatformRole | null {
  const selfServiceRole = getSelfServiceSignupRole();
  return role === selfServiceRole && canSelfRegisterRole(selfServiceRole) ? selfServiceRole : null;
}

function getRecoverableFullName(metadata: AuthMetadata | null | undefined) {
  const fullName = metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const name = metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return "Business User";
}
