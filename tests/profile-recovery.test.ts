import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCreateAccountErrorRedirect,
  buildRecoverableProfilePayload,
  getStableSignupErrorCode,
  logSignupFailure,
  recoverProfile,
  upsertProfile,
  type ProfilePayload
} from "@/lib/auth/profile-recovery";

function createProfileClient(error: unknown = null) {
  const calls: ProfilePayload[] = [];

  return {
    calls,
    client: {
      from(table: "profiles") {
        expect(table).toBe("profiles");

        return {
          async upsert(payload: ProfilePayload) {
            calls.push(payload);
            return { error };
          }
        };
      }
    }
  };
}

describe("profile recovery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a normalized self-service business profile from Auth metadata", () => {
    expect(
      buildRecoverableProfilePayload({
        id: "user_1",
        email: "  CEO@Example.COM ",
        user_metadata: {
          full_name: "  Business CEO ",
          platform_role: "business_user"
        }
      })
    ).toEqual({
      id: "user_1",
      email: "ceo@example.com",
      full_name: "Business CEO",
      platform_role: "business_user"
    });
  });

  it("does not recover internal roles from user-controlled metadata", () => {
    expect(
      buildRecoverableProfilePayload({
        id: "user_2",
        email: "analyst@example.com",
        user_metadata: {
          full_name: "Analyst",
          platform_role: "analyst"
        }
      })
    ).toBeNull();
  });

  it("keeps the signup flow unchanged when Auth signup and profile upsert succeed", async () => {
    const { calls, client } = createProfileClient();
    const payload = {
      id: "user_3",
      email: "ceo@example.com",
      full_name: "Business CEO",
      platform_role: "business_user" as const
    };

    await expect(upsertProfile(client, payload)).resolves.toBeNull();
    expect(calls).toEqual([payload]);
  });

  it("returns a stable profile creation failure code when Auth signup succeeds but profile upsert fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { client } = createProfileClient({
      name: "PostgrestError",
      code: "23505",
      message: "duplicate key value violates unique constraint profiles_email_key"
    });

    await expect(
      upsertProfile(client, {
        id: "user_3",
        email: "ceo@example.com",
        full_name: "Business CEO",
        platform_role: "business_user"
      })
    ).resolves.toBe("profile-creation-failed");

    expect(consoleError).toHaveBeenCalledWith("[auth] profile creation failed after signup", {
      authUserId: "user_3",
      failure: {
        type: "PostgrestError",
        code: "23505",
        status: undefined
      }
    });
  });

  it("does not include the raw provider or database error in the stable profile creation failure code", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const rawError = "database password leaked in provider message";
    const { client } = createProfileClient(rawError);

    const errorCode = await upsertProfile(client, {
      id: "user_6",
      email: "ceo@example.com",
      full_name: "Business CEO",
      platform_role: "business_user"
    });

    expect(errorCode).toBe("profile-creation-failed");
    expect(errorCode).not.toContain(rawError);
  });

  it("builds the create-account failure redirect with only the stable error code", () => {
    const redirectUrl = buildCreateAccountErrorRedirect("profile-creation-failed");

    expect(redirectUrl).toBe("/login?mode=create&error=profile-creation-failed");
    expect(redirectUrl).not.toContain("duplicate key");
    expect(redirectUrl).not.toContain("PostgrestError");
  });

  it("recovers eligible profiles and reports recovery failures explicitly", async () => {
    const successful = createProfileClient();

    await expect(
      recoverProfile(successful.client, {
        id: "user_4",
        email: "ceo@example.com",
        user_metadata: {
          full_name: "Business CEO",
          platform_role: "business_user"
        }
      })
    ).resolves.toBeNull();

    expect(successful.calls).toHaveLength(1);

    const failed = createProfileClient(new Error("database unavailable"));

    await expect(
      recoverProfile(failed.client, {
        id: "user_5",
        email: "ceo@example.com",
        user_metadata: {
          full_name: "Business CEO",
          platform_role: "business_user"
        }
      })
    ).resolves.toBe("profile-recovery-failed");
  });

  it("uses stable signup error codes instead of raw provider messages", () => {
    expect(getStableSignupErrorCode(new Error("Unknown provider failure"))).toBe("create-account-failed");
    expect(getStableSignupErrorCode(null)).toBe("create-account-failed");
  });

  it("maps structured duplicate-account signup errors to a stable code", () => {
    expect(
      getStableSignupErrorCode({
        name: "AuthApiError",
        code: "user_already_exists",
        status: 422,
        message: "raw provider duplicate message"
      })
    ).toBe("email-already-registered");
  });

  it("maps exact duplicate-account provider messages only inside the helper", () => {
    expect(
      getStableSignupErrorCode({
        name: "AuthApiError",
        status: 422,
        message: "User already registered"
      })
    ).toBe("email-already-registered");
  });

  it("keeps raw signup provider messages out of redirect URLs", () => {
    const rawMessage = "User already registered with provider detail";
    const errorCode = getStableSignupErrorCode({
      name: "AuthApiError",
      code: "user_already_exists",
      status: 422,
      message: rawMessage
    });
    const redirectUrl = buildCreateAccountErrorRedirect(errorCode);

    expect(redirectUrl).toBe("/login?mode=create&error=email-already-registered");
    expect(redirectUrl).not.toContain(rawMessage);
  });

  it("logs signup failures with sanitized fields only", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logSignupFailure({
      name: "AuthApiError",
      code: "unexpected_failure",
      status: 500,
      message: "raw provider message with sensitive detail"
    });

    expect(consoleError).toHaveBeenCalledWith("[auth] signup failed", {
      failure: {
        type: "AuthApiError",
        code: "unexpected_failure",
        status: 500
      }
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("raw provider message");
  });
});
