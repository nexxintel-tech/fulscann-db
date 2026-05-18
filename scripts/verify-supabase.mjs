import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL"
];

loadEnvLocal();

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required env values: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const checks = [];

await check("Auth users can be listed", async () => {
  const data = await requestJson(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`);

  return `${data.users.length} user(s) visible to service role`;
});

await check("Profiles table is readable", async () => {
  const count = await requestCount("profiles");

  return `${count ?? 0} profile row(s)`;
});

await check("Businesses table is readable", async () => {
  const count = await requestCount("businesses");

  return `${count ?? 0} business row(s)`;
});

await check("Business users table is readable", async () => {
  const count = await requestCount("business_users");

  return `${count ?? 0} business membership row(s)`;
});

await check("Staff invitations table is readable", async () => {
  const count = await requestCount("staff_invitations");

  return `${count ?? 0} invitation row(s)`;
});

await check("Evidence bucket exists and is private", async () => {
  const data = await requestJson(`${supabaseUrl}/storage/v1/bucket/evidence-files`);

  return data.public ? "bucket exists but is public" : "bucket exists and is private";
});

const failed = checks.filter((item) => item.status === "failed");

for (const item of checks) {
  const marker = item.status === "passed" ? "PASS" : "FAIL";
  console.log(`${marker} ${item.name}: ${item.detail}`);
}

if (failed.length > 0) {
  process.exit(1);
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

async function check(name, fn) {
  try {
    const detail = await fn();
    checks.push({ name, status: "passed", detail });
  } catch (error) {
    checks.push({
      name,
      status: "failed",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: authHeaders()
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }

  return response.json();
}

async function requestCount(tableName) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=id`, {
    method: "HEAD",
    headers: {
      ...authHeaders(),
      Prefer: "count=exact"
    }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }

  const range = response.headers.get("content-range");
  const count = range?.split("/").at(1);

  return count && count !== "*" ? Number(count) : 0;
}

function authHeaders() {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}
