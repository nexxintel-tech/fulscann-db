"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import {
  canEscalateException,
  canMoveExceptionStatus,
  canRequestExceptionClarification
} from "@/lib/ic-engine/actions";
import { hasSupabaseConfig, hasSupabaseServiceConfig } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/server";
import type { ControlException } from "@/lib/types";

const businessActionSchema = z.object({
  businessId: z.string().min(1),
  body: z.string().min(3).max(2000)
});

const escalationSchema = businessActionSchema.extend({
  riskLevel: z.enum(["Orange", "Red"])
});

const reportReviewSchema = z.object({
  reportKey: z.string().min(3)
});

const exceptionActionSchema = z.object({
  businessId: z.string().min(1),
  exceptionId: z.string().min(1),
  body: z.string().min(3).max(2000).optional()
});

export async function addInternalNote(formData: FormData) {
  await writeAnalystNote(formData, "internal_note", "internal");
}

export async function requestClarification(formData: FormData) {
  await writeAnalystNote(formData, "clarification_request", "business_visible");
}

export async function markExceptionInReview(formData: FormData) {
  const profile = await requireRole(["analyst"]);
  const parsed = exceptionActionSchema.safeParse({
    businessId: formData.get("businessId"),
    exceptionId: formData.get("exceptionId"),
    body: "review"
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig() || !hasSupabaseServiceConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const { businessId, exceptionId } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  await ensureAssignedAnalystBusiness(supabase, profile.id, businessId);
  const exception = await fetchExceptionForAction(supabase, businessId, exceptionId);

  if (!exception || !canMoveExceptionStatus("analyst", exception.status, "in_review")) {
    redirect("/dashboard/analyst?action=invalid-transition");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("control_exceptions")
    .update({ status: "in_review", assigned_to: profile.id })
    .eq("id", exceptionId)
    .eq("business_id", businessId);

  if (error) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(error.message)}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "analyst_started_exception_review",
    entityType: "control_exception",
    entityId: exceptionId,
    metadata: { previous_status: exception.status, next_status: "in_review" }
  });

  revalidateAnalystPaths();
  redirect("/dashboard/analyst?action=exception-in-review");
}

export async function requestExceptionClarification(formData: FormData) {
  const profile = await requireRole(["analyst"]);
  const parsed = exceptionActionSchema.safeParse({
    businessId: formData.get("businessId"),
    exceptionId: formData.get("exceptionId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig() || !hasSupabaseServiceConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const { businessId, exceptionId, body } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  await ensureAssignedAnalystBusiness(supabase, profile.id, businessId);
  const exception = await fetchExceptionForAction(supabase, businessId, exceptionId);

  if (!exception || !canRequestExceptionClarification("analyst", exception)) {
    redirect("/dashboard/analyst?action=invalid-transition");
  }

  const { data: note, error } = await supabase
    .from("analyst_notes")
    .insert({
      business_id: businessId,
      analyst_user_id: profile.id,
      note_type: "clarification_request",
      body: `IC exception - ${exception.title}: ${body}`,
      visibility: "business_visible"
    })
    .select("id")
    .single();

  if (error || !note) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  if (exception.status === "open") {
    await createSupabaseAdminClient()
      .from("control_exceptions")
      .update({ status: "in_review", assigned_to: profile.id })
      .eq("id", exceptionId)
      .eq("business_id", businessId);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "analyst_requested_exception_clarification",
    entityType: "control_exception",
    entityId: exceptionId,
    metadata: { note_id: note.id, previous_status: exception.status, next_status: "in_review" }
  });

  revalidateAnalystPaths();
  redirect("/dashboard/analyst?action=exception-clarification-requested");
}

export async function escalateException(formData: FormData) {
  const profile = await requireRole(["analyst"]);
  const parsed = exceptionActionSchema.safeParse({
    businessId: formData.get("businessId"),
    exceptionId: formData.get("exceptionId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig() || !hasSupabaseServiceConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const { businessId, exceptionId, body } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  await ensureAssignedAnalystBusiness(supabase, profile.id, businessId);
  const exception = await fetchExceptionForAction(supabase, businessId, exceptionId);

  if (!exception || !canEscalateException("analyst", exception)) {
    redirect("/dashboard/analyst?action=invalid-transition");
  }

  const { data: superAdmin } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin")
    .limit(1)
    .single();

  if (!superAdmin) {
    redirect("/dashboard/analyst?action=no-super-admin");
  }

  const { data: escalation, error } = await supabase
    .from("analyst_escalations")
    .insert({
      business_id: businessId,
      analyst_user_id: profile.id,
      escalated_to: superAdmin.id,
      risk_level: exception.riskLevel,
      reason: `IC exception - ${exception.title}: ${body}`,
      status: "open"
    })
    .select("id")
    .single();

  if (error || !escalation) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  if (exception.status === "open") {
    await createSupabaseAdminClient()
      .from("control_exceptions")
      .update({ status: "in_review", assigned_to: profile.id })
      .eq("id", exceptionId)
      .eq("business_id", businessId);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "analyst_escalated_exception",
    entityType: "control_exception",
    entityId: exceptionId,
    metadata: {
      escalation_id: escalation.id,
      risk_level: exception.riskLevel,
      previous_status: exception.status,
      next_status: "in_review"
    }
  });

  revalidateAnalystPaths();
  redirect("/dashboard/analyst?action=exception-escalated");
}

export async function markReportReviewReady(formData: FormData) {
  const profile = await requireRole(["analyst"]);
  const parsed = reportReviewSchema.safeParse({
    reportKey: formData.get("reportKey")
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const supabase = await createSupabaseRouteClient();
  const [reportId, businessId] = parsed.data.reportKey.split("::");

  if (!reportId || !businessId) {
    redirect("/dashboard/analyst?action=invalid");
  }

  const { error: reportError } = await supabase
    .from("department_reports")
    .update({ status: "review_ready" })
    .eq("id", reportId)
    .eq("business_id", businessId);

  if (reportError) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(reportError.message)}`);
  }

  const { data: note } = await supabase
    .from("analyst_notes")
    .insert({
      business_id: businessId,
      analyst_user_id: profile.id,
      note_type: "review_ready",
      body: `Marked report ${reportId} as review-ready.`,
      visibility: "internal"
    })
    .select("id")
    .single();

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "analyst_marked_report_review_ready",
    entityType: "department_report",
    entityId: reportId,
    metadata: { note_id: note?.id ?? null }
  });

  revalidateAnalystPaths();
  redirect("/dashboard/analyst?action=review-ready");
}

async function ensureAssignedAnalystBusiness(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>,
  analystId: string,
  businessId: string
) {
  const { data } = await supabase
    .from("analyst_assignments")
    .select("id")
    .eq("analyst_user_id", analystId)
    .eq("business_id", businessId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) {
    redirect("/dashboard/analyst?action=not-assigned");
  }
}

async function fetchExceptionForAction(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>,
  businessId: string,
  exceptionId: string
): Promise<ControlException | null> {
  const { data } = await supabase
    .from("control_exceptions")
    .select("id, business_id, title, risk_level, status, created_at")
    .eq("id", exceptionId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    title: data.title,
    riskLevel: data.risk_level,
    status: data.status,
    daysOpen: 0
  };
}

export async function escalateIssue(formData: FormData) {
  const profile = await requireRole(["analyst"]);
  const parsed = escalationSchema.safeParse({
    businessId: formData.get("businessId"),
    body: formData.get("body"),
    riskLevel: formData.get("riskLevel")
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const supabase = await createSupabaseRouteClient();
  const { businessId, body, riskLevel } = parsed.data;
  const { data: superAdmin } = await supabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin")
    .limit(1)
    .single();

  if (!superAdmin) {
    redirect("/dashboard/analyst?action=no-super-admin");
  }

  const { data: escalation, error } = await supabase
    .from("analyst_escalations")
    .insert({
      business_id: businessId,
      analyst_user_id: profile.id,
      escalated_to: superAdmin.id,
      risk_level: riskLevel,
      reason: body,
      status: "open"
    })
    .select("id")
    .single();

  if (error || !escalation) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "analyst_escalated_issue",
    entityType: "analyst_escalation",
    entityId: escalation.id,
    metadata: { risk_level: riskLevel }
  });

  revalidateAnalystPaths();
  redirect("/dashboard/analyst?action=escalated");
}

async function writeAnalystNote(
  formData: FormData,
  noteType: "internal_note" | "clarification_request",
  visibility: "internal" | "business_visible"
) {
  const profile = await requireRole(["analyst"]);
  const parsed = businessActionSchema.safeParse({
    businessId: formData.get("businessId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    redirect("/dashboard/analyst?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/analyst?action=demo");
  }

  const supabase = await createSupabaseRouteClient();
  const { businessId, body } = parsed.data;
  const { data: note, error } = await supabase
    .from("analyst_notes")
    .insert({
      business_id: businessId,
      analyst_user_id: profile.id,
      note_type: noteType,
      body,
      visibility
    })
    .select("id")
    .single();

  if (error || !note) {
    redirect(`/dashboard/analyst?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: noteType === "internal_note" ? "analyst_note_added" : "analyst_requested_clarification",
    entityType: "analyst_note",
    entityId: note.id
  });

  revalidateAnalystPaths();
  redirect(`/dashboard/analyst?action=${noteType === "internal_note" ? "note-added" : "clarification-requested"}`);
}

async function writeAuditEvent(input: {
  businessId: string;
  actorUserId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseRouteClient();
  await supabase.from("audit_events").insert({
    business_id: input.businessId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {}
  });
}

function revalidateAnalystPaths() {
  revalidatePath("/dashboard/analyst");
  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/ceo");
}
