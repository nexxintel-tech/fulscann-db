import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const expectedRoles = {
  superAdmin: "super_admin",
  analyst: "analyst",
  ceo: "business_user",
  staff: "business_user",
  institution: "institution_user"
};

loadEnvLocal();

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required env values: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const users = parseUsers(process.env.FULSCANN_TEST_USERS ?? loadGeneratedTestUsers());
const checks = [];

for (const [key, expectedRole] of Object.entries(expectedRoles)) {
  await check(`${key} can sign in and has a matching ${expectedRole} profile`, async () => {
    const session = await signIn(users[key]);
    const profile = await requestJson(session, "/rest/v1/profiles?select=id,email,platform_role");
    const ownProfile = profile.find((row) => row.id === session.user.id);

    if (!ownProfile) throw new Error("profile row not visible for signed-in user");
    if (ownProfile.platform_role !== expectedRole) {
      throw new Error(`expected ${expectedRole}, found ${ownProfile.platform_role}`);
    }

    return `${maskEmail(session.user.email)} -> ${ownProfile.platform_role}`;
  });
}

await check("CEO can see business workspace through RLS", async () => {
  const session = await signIn(users.ceo);
  const businesses = await requestJson(session, "/rest/v1/businesses?select=id,legal_name,owner_user_id");
  if (businesses.length === 0) throw new Error("CEO sees no businesses");
  return `${businesses.length} business row(s) visible`;
});

await check("Staff can see accepted business membership through RLS", async () => {
  const session = await signIn(users.staff);
  const memberships = await requestJson(session, "/rest/v1/business_users?select=id,business_id,role,status");
  const active = memberships.filter((membership) => membership.status === "active");
  if (active.length === 0) throw new Error("staff user sees no active business membership");
  return `${active.length} active membership row(s) visible`;
});

await check("Staff can upload evidence through private storage RLS", async () => {
  const session = await signIn(users.staff);
  const memberships = await requestJson(session, "/rest/v1/business_users?select=business_id,status");
  const membership = memberships.find((item) => item.status === "active");
  if (!membership) throw new Error("staff user sees no active business membership");

  const reports = await requestJson(session, `/rest/v1/department_reports?business_id=eq.${membership.business_id}&select=id,business_id`);
  const report = reports[0];
  if (!report) throw new Error("staff user sees no department report to attach evidence to");

  const path = `${membership.business_id}/${report.id}/secure-rls-${Date.now()}.txt`;
  const upload = await requestRaw(session, `/storage/v1/object/evidence-files/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "x-upsert": "false"
    },
    body: "secure workflow evidence upload check"
  });
  if (!upload.ok) throw new Error(`storage upload rejected: ${upload.status} ${await upload.text()}`);

  const evidenceRows = await requestJson(session, "/rest/v1/evidence_files?select=id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: membership.business_id,
      report_id: report.id,
      uploaded_by: session.user.id,
      file_name: "secure-rls-check.txt",
      file_type: "verification",
      storage_path: path,
      file_size: 35,
      evidence_level: 2,
      verification_status: "pending"
    })
  });
  if (evidenceRows.length === 0) throw new Error("evidence metadata insert did not return a row");

  return `uploaded private evidence and inserted metadata row`;
});

await check("Analyst can see assigned businesses but not write CEO-owned business data", async () => {
  const session = await signIn(users.analyst);
  const assignments = await requestJson(session, "/rest/v1/analyst_assignments?select=id,business_id,status");
  const active = assignments.filter((assignment) => assignment.status === "active");
  if (active.length === 0) throw new Error("analyst sees no active assignments");

  const denied = await requestRaw(session, `/rest/v1/businesses?id=eq.${active[0].business_id}&select=id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ legal_name: "RLS should reject this" })
  });
  if (!denied.ok) {
    return `${active.length} active assignment row(s); business update rejected`;
  }

  const updatedRows = await denied.json();
  if (updatedRows.length > 0) throw new Error("analyst business update changed a CEO-owned business row");

  return `${active.length} active assignment row(s); business update rejected`;
});

await check("Institution can see only CEO-granted report access", async () => {
  const session = await signIn(users.institution);
  const grants = await requestJson(session, "/rest/v1/institution_access?select=id,business_id,status");
  const active = grants.filter((grant) => grant.status === "active");
  if (active.length === 0) throw new Error("institution user sees no active report access grants");

  const businesses = await requestJson(session, "/rest/v1/businesses?select=id,legal_name,integrity_report_ready");
  if (businesses.length === 0) throw new Error("institution user sees no approved businesses");

  return `${active.length} access grant(s), ${businesses.length} approved business row(s) visible`;
});

for (const item of checks) {
  const marker = item.status === "passed" ? "PASS" : "FAIL";
  console.log(`${marker} ${item.name}: ${item.detail}`);
}

if (checks.some((item) => item.status === "failed")) {
  process.exit(1);
}

async function signIn(user) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: user.email, password: user.password })
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.access_token || !data.user?.id) {
    throw new Error("Auth response did not include an access token and user id");
  }

  return data;
}

async function requestJson(session, path, options = {}) {
  const response = await requestRaw(session, path, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  }
  return response.json();
}

async function requestRaw(session, path, options = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers ?? {})
    }
  });
}

async function check(name, fn) {
  try {
    checks.push({ name, status: "passed", detail: await fn() });
  } catch (error) {
    checks.push({ name, status: "failed", detail: error instanceof Error ? error.message : String(error) });
  }
}

function parseUsers(value) {
  if (!value) {
    throwExit("Set FULSCANN_TEST_USERS or run npm run supabase:bootstrap-secure-test-data first.");
  }

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throwExit(`FULSCANN_TEST_USERS is not valid JSON: ${error.message}`);
  }

  for (const key of Object.keys(expectedRoles)) {
    if (!parsed[key]?.email || !parsed[key]?.password) {
      throwExit(`FULSCANN_TEST_USERS.${key}.email and password are required.`);
    }
  }

  return parsed;
}

function loadGeneratedTestUsers() {
  const credentialPath = resolve(process.cwd(), ".fulscann-test-users.local.json");
  if (!existsSync(credentialPath)) {
    return undefined;
  }

  return readFileSync(credentialPath, "utf8");
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
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function maskEmail(email = "") {
  const [name, domain] = email.split("@");
  return `${name?.slice(0, 2) ?? "**"}***@${domain ?? "hidden"}`;
}

function throwExit(message) {
  console.error(message);
  process.exit(1);
}
