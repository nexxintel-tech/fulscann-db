import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const allowedRoles = new Set(["super_admin", "analyst", "business_user", "institution_user"]);
const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "FULSCANN_BOOTSTRAP_USERS"];

loadEnvLocal();

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required env values: ${missing.join(", ")}`);
  console.error("Set FULSCANN_BOOTSTRAP_USERS to a JSON array before running this command.");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const users = parseUsers(process.env.FULSCANN_BOOTSTRAP_USERS);

for (const user of users) {
  const authUser = await findOrCreateAuthUser(user);
  await upsertProfile(authUser.id, user);
  console.log(`BOOTSTRAPPED ${user.email} as ${user.platformRole}`);
}

function parseUsers(value) {
  let parsed;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throwExit(`FULSCANN_BOOTSTRAP_USERS is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throwExit("FULSCANN_BOOTSTRAP_USERS must be a non-empty JSON array.");
  }

  return parsed.map((user, index) => {
    const email = requireString(user.email, `users[${index}].email`).toLowerCase();
    const password = requireString(user.password, `users[${index}].password`);
    const fullName = requireString(user.fullName, `users[${index}].fullName`);
    const platformRole = requireString(user.platformRole, `users[${index}].platformRole`);

    if (!allowedRoles.has(platformRole)) {
      throwExit(`Invalid platformRole for ${email}: ${platformRole}`);
    }

    if (password.length < 8) {
      throwExit(`Password for ${email} must be at least 8 characters.`);
    }

    return { email, password, fullName, platformRole };
  });
}

async function findOrCreateAuthUser(user) {
  const existing = await findAuthUserByEmail(user.email);

  if (existing) {
    return existing;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        platform_role: user.platformRole
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create Auth user ${user.email}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function findAuthUserByEmail(email) {
  let page = 1;

  while (page < 20) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=100`, {
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to list Auth users: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const match = data.users.find((user) => user.email?.toLowerCase() === email);

    if (match || data.users.length < 100) {
      return match ?? null;
    }

    page += 1;
  }

  return null;
}

async function upsertProfile(authUserId, user) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      id: authUserId,
      email: user.email,
      full_name: user.fullName,
      platform_role: user.platformRole
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert profile for ${user.email}: ${response.status} ${await response.text()}`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throwExit(`${label} is required.`);
  }

  return value.trim();
}

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  let contents = "";

  try {
    contents = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function authHeaders() {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}

function throwExit(message) {
  console.error(message);
  process.exit(1);
}
