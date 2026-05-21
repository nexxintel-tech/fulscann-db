import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const credentialPath = resolve(process.cwd(), ".fulscann-test-users.local.json");
const userPlan = {
  superAdmin: { email: "fulscann.superadmin.test@example.com", fullName: "Fulscann Test Super Admin", platformRole: "super_admin" },
  analyst: { email: "fulscann.analyst.test@example.com", fullName: "Fulscann Test Analyst", platformRole: "analyst" },
  ceo: { email: "fulscann.ceo.test@example.com", fullName: "Fulscann Test CEO", platformRole: "business_user" },
  staff: { email: "fulscann.staff.test@example.com", fullName: "Fulscann Test Staff", platformRole: "business_user" },
  institution: { email: "fulscann.institution.test@example.com", fullName: "Fulscann Test Institution", platformRole: "institution_user" }
};
const ids = {
  business: "11111111-1111-4111-8111-111111111111",
  ceoMembership: "11111111-1111-4111-8111-111111111112",
  staffMembership: "11111111-1111-4111-8111-111111111113",
  salesDepartment: "22222222-2222-4222-8222-222222222221",
  financeDepartment: "22222222-2222-4222-8222-222222222222",
  procurementDepartment: "22222222-2222-4222-8222-222222222223",
  salesReport: "33333333-3333-4333-8333-333333333331",
  financeReport: "33333333-3333-4333-8333-333333333332",
  kpi: "44444444-4444-4444-8444-444444444441",
  veriScore: "55555555-5555-4555-8555-555555555551",
  icScore: "55555555-5555-4555-8555-555555555552",
  staffInvitation: "66666666-6666-4666-8666-666666666661",
  analystAssignment: "77777777-7777-4777-8777-777777777771",
  institutionAccess: "88888888-8888-4888-8888-888888888881",
  exception: "99999999-9999-4999-8999-999999999991"
};

loadEnvLocal();

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required env values: ${missing.join(", ")}`);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const credentials = loadOrCreateCredentials();
const authUsers = {};

for (const [key, user] of Object.entries(userPlan)) {
  const authUser = await findOrCreateAuthUser({ ...user, password: credentials[key].password });
  await updateAuthPassword(authUser.id, credentials[key].password);
  await upsert("profiles", {
    id: authUser.id,
    email: user.email,
    full_name: user.fullName,
    platform_role: user.platformRole
  });
  authUsers[key] = authUser;
  console.log(`READY ${key}: ${maskEmail(user.email)} (${user.platformRole})`);
}

await upsert("businesses", {
  id: ids.business,
  legal_name: "Fulscann Secure Workflow Test Ltd",
  trading_name: "Fulscann Secure Test",
  sector: "Food processing",
  location: "Lagos, Nigeria",
  owner_user_id: authUsers.ceo.id,
  onboarding_progress: 100,
  assessment_complete: true,
  kpi_setup_complete: true,
  current_veriscore: 78,
  previous_veriscore: 72,
  current_ic_score: 74,
  previous_ic_score: 68,
  evidence_completion: 80,
  integrity_report_ready: true,
  last_activity_at: new Date().toISOString()
});

await upsertMany("business_users", [
  { id: ids.ceoMembership, business_id: ids.business, user_id: authUsers.ceo.id, role: "ceo", department_id: null, status: "active" },
  { id: ids.staffMembership, business_id: ids.business, user_id: authUsers.staff.id, role: "sales_officer", department_id: ids.salesDepartment, status: "active" }
]);

await upsertMany("departments", [
  { id: ids.salesDepartment, business_id: ids.business, name: "Sales", department_type: "sales", created_by: authUsers.ceo.id },
  { id: ids.financeDepartment, business_id: ids.business, name: "Finance", department_type: "finance", created_by: authUsers.ceo.id },
  { id: ids.procurementDepartment, business_id: ids.business, name: "Procurement", department_type: "procurement", created_by: authUsers.ceo.id }
]);

await upsert("staff_invitations", {
  id: ids.staffInvitation,
  business_id: ids.business,
  department_id: ids.salesDepartment,
  email: userPlan.staff.email,
  role: "sales_officer",
  status: "accepted",
  invitation_token: "secureworkflowtestinvite",
  invited_by: authUsers.ceo.id,
  accepted_at: new Date().toISOString()
});

await upsert("kpi_targets", {
  id: ids.kpi,
  business_id: ids.business,
  name: "Sales-to-Finance Match Rate",
  target_value: 95,
  unit: "%",
  period: "monthly",
  created_by: authUsers.ceo.id
});

await upsert("veriscore_results", {
  id: ids.veriScore,
  business_id: ids.business,
  veriscore: 78,
  version: "v1.0",
  created_by: authUsers.ceo.id
});

await upsert("ic_scores", {
  id: ids.icScore,
  business_id: ids.business,
  score: 74,
  version: "v1.0",
  created_by: authUsers.staff.id
});

await upsertMany("department_reports", [
  { id: ids.salesReport, business_id: ids.business, department: "sales", status: "submitted", value: 2_400_000, evidence_count: 1, submitted_by: authUsers.staff.id },
  { id: ids.financeReport, business_id: ids.business, department: "finance", status: "review_ready", value: 2_350_000, evidence_count: 1, submitted_by: authUsers.ceo.id }
]);

await upsert("analyst_assignments", {
  id: ids.analystAssignment,
  analyst_user_id: authUsers.analyst.id,
  business_id: ids.business,
  assigned_by: authUsers.superAdmin.id,
  status: "active"
});

await upsert("institution_access", {
  id: ids.institutionAccess,
  business_id: ids.business,
  institution_name: "Fulscann Test Credit Desk",
  institution_email: userPlan.institution.email,
  status: "active",
  granted_by: authUsers.ceo.id
});

await upsert("control_exceptions", {
  id: ids.exception,
  business_id: ids.business,
  title: "Secure workflow evidence quality check",
  description: "Live test exception used to validate secure CEO, Analyst, and Institution visibility.",
  risk_level: "Orange",
  status: "open",
  assigned_to: authUsers.analyst.id
});

console.log(`WROTE local test credentials to ${credentialPath}`);
console.log("Set FULSCANN_TEST_USERS from that file or run npm run supabase:verify-secure directly.");

function loadOrCreateCredentials() {
  const defaultPassword = process.env.FULSCANN_DEFAULT_TEST_PASSWORD?.trim();

  if (existsSync(credentialPath)) {
    const existing = JSON.parse(readFileSync(credentialPath, "utf8"));
    if (!defaultPassword) {
      return existing;
    }

    const updated = Object.fromEntries(
      Object.entries(userPlan).map(([key, user]) => [
        key,
        {
          email: user.email,
          password: defaultPassword
        }
      ])
    );
    writeFileSync(credentialPath, `${JSON.stringify(updated, null, 2)}\n`, { mode: 0o600 });
    return updated;
  }

  const generated = Object.fromEntries(
    Object.entries(userPlan).map(([key, user]) => [
      key,
      {
        email: user.email,
        password: defaultPassword || `Fulscann-${key}-${randomBytes(12).toString("hex")}!`
      }
    ])
  );

  writeFileSync(credentialPath, `${JSON.stringify(generated, null, 2)}\n`, { mode: 0o600 });
  return generated;
}

async function findOrCreateAuthUser(user) {
  const existing = await findAuthUserByEmail(user.email);
  if (existing) return existing;

  const response = await fetchWithRetry(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName, platform_role: user.platformRole }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create Auth user ${user.email}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function updateAuthPassword(userId, password) {
  const response = await fetchWithRetry(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ password, email_confirm: true })
  });

  if (!response.ok) {
    throw new Error(`Failed to update Auth password: ${response.status} ${await response.text()}`);
  }
}

async function findAuthUserByEmail(email) {
  let page = 1;
  while (page < 20) {
    const response = await fetchWithRetry(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=100`, { headers: authHeaders() });
    if (!response.ok) throw new Error(`Failed to list Auth users: ${response.status} ${await response.text()}`);
    const data = await response.json();
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match || data.users.length < 100) return match ?? null;
    page += 1;
  }
  return null;
}

async function upsert(table, row) {
  await upsertMany(table, [row]);
}

async function upsertMany(table, rows) {
  const response = await fetchWithRetry(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert ${table}: ${response.status} ${await response.text()}`);
  }
}

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }

  throw lastError;
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

function authHeaders() {
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
