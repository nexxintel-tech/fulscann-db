"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { buildDefaultBusinessKpis } from "@/lib/kpis/default-kpis";
import { buildBusinessKpiInsertPayload } from "@/lib/kpis/kpi-form";
import { calculateVeriScore } from "@/lib/scoring/veriscore";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const businessSchema = z.object({
  legalName: z.string().min(2).max(180),
  tradingName: z.string().max(180).optional(),
  sector: z.string().min(2).max(120),
  location: z.string().min(2).max(160)
});

const assessmentSchema = z.object({
  businessId: z.string().min(1),
  structure: z.coerce.number().min(0).max(100),
  finance: z.coerce.number().min(0).max(100),
  controls: z.coerce.number().min(0).max(100),
  evidence: z.coerce.number().min(0).max(100),
  governance: z.coerce.number().min(0).max(100)
});

const kpiSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(160),
  targetValue: z.coerce.number().positive(),
  unit: z.string().min(1).max(40),
  period: z.enum(["monthly", "quarterly", "annual"])
});

const addBusinessKpiSchema = z.object({
  businessId: z.string().min(1),
  departmentId: z.string().min(1),
  selectedKpiKey: z.string().min(1),
  customName: z.string().max(160).optional(),
  targetValue: z.preprocess(
    (value) => value === "" ? null : value,
    z.coerce.number().nonnegative().nullable()
  ),
  unit: z.string().min(1).max(40),
  defaultFrequency: z.enum(["monthly", "quarterly", "annual"])
});

const departmentSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(120),
  departmentType: z.enum(["sales", "finance", "procurement", "operations", "hr"])
});

const businessKpiSchema = z.object({
  businessId: z.string().min(1),
  kpiId: z.string().min(1),
  targetValue: z.preprocess(
    (value) => value === "" ? null : value,
    z.coerce.number().nonnegative().nullable()
  ),
  defaultFrequency: z.enum(["monthly", "quarterly", "annual"]),
  isActive: z.enum(["true", "false"]).default("true")
});

export async function createBusinessProfile(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = businessSchema.safeParse({
    legalName: formData.get("legalName"),
    tradingName: formData.get("tradingName"),
    sector: formData.get("sector"),
    location: formData.get("location")
  });

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      legal_name: parsed.data.legalName,
      trading_name: parsed.data.tradingName || null,
      sector: parsed.data.sector,
      location: parsed.data.location,
      owner_user_id: profile.id,
      onboarding_progress: 20,
      last_activity_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error || !business) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("business_users").insert({
    business_id: business.id,
    user_id: profile.id,
    role: "ceo",
    status: "active"
  });

  await writeAuditEvent(business.id, profile.id, "ceo_created_business_profile", "business", business.id);
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=business-created");
}

export async function submitAssessment(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, ...scores } = parsed.data;
  const responses = Object.entries(scores).map(([category, score]) => ({
    business_id: businessId,
    category,
    score,
    submitted_by: profile.id
  }));
  const veriscore = calculateVeriScore(
    Object.entries(scores).map(([category, score]) => ({
      category: category as keyof typeof scores,
      score
    }))
  );

  const { error: responseError } = await supabase.from("assessment_responses").insert(responses);
  if (responseError) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(responseError.message)}`);

  const { data: result, error: resultError } = await supabase
    .from("veriscore_results")
    .insert({ business_id: businessId, veriscore, version: "v1.0", created_by: profile.id })
    .select("id")
    .single();

  if (resultError || !result) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(resultError?.message ?? "failed")}`);

  await supabase
    .from("businesses")
    .update({
      previous_veriscore: veriscore,
      current_veriscore: veriscore,
      assessment_complete: true,
      onboarding_progress: 45,
      last_activity_at: new Date().toISOString()
    })
    .eq("id", businessId);

  await writeAuditEvent(businessId, profile.id, "ceo_submitted_assessment", "veriscore_result", result.id, { veriscore });
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=assessment-submitted");
}

export async function createKpiTarget(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = kpiSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, name, targetValue, unit, period } = parsed.data;
  const { data: kpi, error } = await supabase
    .from("kpi_targets")
    .insert({ business_id: businessId, name, target_value: targetValue, unit, period, created_by: profile.id })
    .select("id")
    .single();

  if (error || !kpi) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("businesses").update({ kpi_setup_complete: true, onboarding_progress: 65 }).eq("id", businessId);
  await writeAuditEvent(businessId, profile.id, "ceo_created_kpi_target", "kpi_target", kpi.id);
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=kpi-created");
}

export async function addBusinessKpi(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = addBusinessKpiSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, departmentId, selectedKpiKey, customName, targetValue, unit, defaultFrequency } = parsed.data;
  const { data: department } = await supabase
    .from("departments")
    .select("id, department_type")
    .eq("id", departmentId)
    .eq("business_id", businessId)
    .single();

  if (!department) redirect("/dashboard/ceo/onboarding?action=invalid-department");

  let payload;

  try {
    payload = buildBusinessKpiInsertPayload({
      businessId,
      department: {
        id: department.id,
        departmentType: department.department_type
      },
      selectedKpiKey,
      customName,
      targetValue,
      unit,
      defaultFrequency,
      createdBy: profile.id
    });
  } catch (error) {
    redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error instanceof Error ? error.message : "invalid")}`);
  }

  const { data: existingKpi } = await supabase
    .from("business_kpis")
    .select("id")
    .eq("business_id", businessId)
    .eq("department_id", departmentId)
    .eq("kpi_key", payload.kpi_key)
    .maybeSingle();

  if (existingKpi) {
    redirect("/dashboard/ceo/onboarding?action=duplicate-kpi");
  }

  const { data: kpi, error } = await supabase
    .from("business_kpis")
    .insert(payload)
    .select("id")
    .single();

  if (error || !kpi) {
    const message = error?.message.toLowerCase() ?? "";
    if (message.includes("duplicate") || message.includes("unique")) {
      redirect("/dashboard/ceo/onboarding?action=duplicate-kpi");
    }

    redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  await supabase.from("businesses").update({ kpi_setup_complete: true, onboarding_progress: 65 }).eq("id", businessId);
  await writeAuditEvent(businessId, profile.id, "ceo_added_business_kpi", "business_kpi", kpi.id, {
    kpi_key: payload.kpi_key,
    is_default: payload.is_default,
    department_id: departmentId
  });
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=business-kpi-added");
}

export async function createDepartment(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, name, departmentType } = parsed.data;
  const { data: department, error } = await supabase
    .from("departments")
    .insert({ business_id: businessId, name, department_type: departmentType, created_by: profile.id })
    .select("id")
    .single();

  if (error || !department) {
    const { data: existingDepartment } = await supabase
      .from("departments")
      .select("id")
      .eq("business_id", businessId)
      .eq("department_type", departmentType)
      .single();

    if (!existingDepartment) {
      redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error?.message ?? "failed")}`);
    }

    await ensureDefaultKpisForDepartment({
      businessId,
      departmentId: existingDepartment.id,
      departmentType,
      createdBy: profile.id
    });

    revalidateCeoOnboarding();
    redirect("/dashboard/ceo/onboarding?action=department-initialized");
  }

  await ensureDefaultKpisForDepartment({
    businessId,
    departmentId: department.id,
    departmentType,
    createdBy: profile.id
  });

  await supabase.from("businesses").update({ onboarding_progress: 80 }).eq("id", businessId);
  await writeAuditEvent(businessId, profile.id, "ceo_created_department", "department", department.id);
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=department-created");
}

export async function updateBusinessKpi(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = businessKpiSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/ceo/onboarding?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/ceo/onboarding?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, kpiId, targetValue, defaultFrequency, isActive } = parsed.data;
  const { error } = await supabase
    .from("business_kpis")
    .update({
      target_value: targetValue,
      default_frequency: defaultFrequency,
      is_active: isActive === "true",
      updated_at: new Date().toISOString()
    })
    .eq("id", kpiId)
    .eq("business_id", businessId);

  if (error) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error.message)}`);

  await supabase.from("businesses").update({ kpi_setup_complete: true, onboarding_progress: 65 }).eq("id", businessId);
  await writeAuditEvent(businessId, profile.id, "ceo_updated_business_kpi", "business_kpi", kpiId, {
    target_value: targetValue,
    default_frequency: defaultFrequency,
    is_active: isActive === "true"
  });
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=kpi-updated");
}

async function writeAuditEvent(
  businessId: string,
  actorUserId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createSupabaseRouteClient();
  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: actorUserId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    metadata
  });
}

function revalidateCeoOnboarding() {
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/ceo/onboarding");
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/analyst");
}

async function ensureDefaultKpisForDepartment(input: {
  businessId: string;
  departmentId: string;
  departmentType: "sales" | "finance" | "procurement" | "operations" | "hr";
  createdBy: string;
}) {
  const rows = buildDefaultBusinessKpis({
    businessId: input.businessId,
    departmentId: input.departmentId,
    departmentSlug: input.departmentType,
    createdBy: input.createdBy
  });

  if (rows.length === 0) {
    return;
  }

  const supabase = await createSupabaseRouteClient();
  await supabase
    .from("business_kpis")
    .upsert(rows, {
      onConflict: "business_id,department_id,kpi_key",
      ignoreDuplicates: true
    });
}
