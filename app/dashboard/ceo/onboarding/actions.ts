"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
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

const departmentSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(2).max(120),
  departmentType: z.enum(["sales", "finance", "procurement", "operations", "hr"])
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

  if (error || !department) redirect(`/dashboard/ceo/onboarding?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("businesses").update({ onboarding_progress: 80 }).eq("id", businessId);
  await writeAuditEvent(businessId, profile.id, "ceo_created_department", "department", department.id);
  revalidateCeoOnboarding();
  redirect("/dashboard/ceo/onboarding?action=department-created");
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
  revalidatePath("/dashboard/analyst");
}
