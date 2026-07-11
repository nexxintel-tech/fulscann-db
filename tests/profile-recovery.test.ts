import { describe, expect, it } from "vitest";
import {
  buildRecoverableProfilePayload,
  getStableSignupErrorCode,
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

  it("returns stable profile creation failure codes", async () => {
    const { client } = createProfileClient(new Error("database unavailable"));

    await expect(
      upsertProfile(client, {
        id: "user_3",
        email: "ceo@example.com",
        full_name: "Business CEO",
        platform_role: "business_user"
      })
    ).resolves.toBe("profile-create-failed");
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
    expect(getStableSignupErrorCode(new Error("User already registered"))).toBe("create-account-failed");
    expect(getStableSignupErrorCode(null)).toBe("create-account-failed");
  });
});
