import { canSelfRegisterRole, getSelfServiceSignupRole, normalizeAuthEmail } from "@/lib/auth/signup";
import type { PlatformRole } from "@/lib/auth/roles";

export type LoginErrorCode =
  | "create-account-failed"
  | "email-already-registered"
  | "invalid-create-account"
  | "missing-profile"
  | "profile-creation-failed"
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
  return isDuplicateAccountError(error) ? "email-already-registered" : "create-account-failed";
}

export function buildCreateAccountErrorRedirect(errorCode: LoginErrorCode) {
  return `/login?mode=create&error=${errorCode}`;
}

export function logSignupFailure(error: unknown) {
  console.error("[auth] signup failed", {
    failure: summarizeAuthError(error)
  });
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

  if (!error) {
    return null;
  }

  console.error("[auth] profile creation failed after signup", {
    authUserId: payload.id,
    failure: summarizeAuthError(error)
  });

  return "profile-creation-failed";
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

function summarizeAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { type: typeof error };
  }

  const maybeError = error as { name?: unknown; code?: unknown; status?: unknown };

  return {
    type: typeof maybeError.name === "string" ? maybeError.name : "unknown",
    code: typeof maybeError.code === "string" ? maybeError.code : undefined,
    status: typeof maybeError.status === "number" ? maybeError.status : undefined
  };
}

function isDuplicateAccountError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; name?: unknown; status?: unknown; message?: unknown };
  const code = typeof maybeError.code === "string" ? maybeError.code.toLowerCase() : "";
  const name = typeof maybeError.name === "string" ? maybeError.name : "";

  if (
    [
      "email_exists",
      "email_address_already_exists",
      "user_already_exists",
      "user_already_registered"
    ].includes(code)
  ) {
    return true;
  }

  if (name === "AuthApiError" && maybeError.status === 422 && isExactDuplicateAccountMessage(maybeError.message)) {
    return true;
  }

  return false;
}

function isExactDuplicateAccountMessage(message: unknown) {
  if (typeof message !== "string") {
    return false;
  }

  return ["User already registered", "A user with this email address has already been registered"].includes(message);
}
