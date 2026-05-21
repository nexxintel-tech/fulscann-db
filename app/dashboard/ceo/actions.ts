"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { canMoveExceptionStatus } from "@/lib/ic-engine/actions";
import { runIcAutomationForBusiness } from "@/lib/ic-engine/workflow";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { ExceptionStatus } from "@/lib/types";

const responseSchema = z.object({
  businessId: z.string().min(1),
  linkedEntityId: z.string().min(1),
  body: z.string().min(3).max(2000)
});

const shareSchema = z.object({
  businessId: z.string().min(1),
  institutionName: z.string().min(2).max(160),
  institutionEmail: z.string().email()
});

const revokeSchema = z.object({
  businessId: z.string().min(1),
  accessId: z.string().min(1)
});

export async function respondToClarification(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = responseSchema.safeParse({
    businessId: formData.get("businessId"),
    linkedEntityId: formData.get("linkedEntityId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    redirect("/dashboard/ceo?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/ceo?action=demo");
  }

  const { businessId, linkedEntityId, body } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  const { data: response, error } = await supabase
    .from("ceo_responses")
    .insert({
      business_id: businessId,
      responder_user_id: profile.id,
      response_type: "clarification_response",
      body,
      linked_entity_type: "analyst_note",
      linked_entity_id: linkedEntityId
    })
    .select("id")
    .single();

  if (error || !response) {
    redirect(`/dashboard/ceo?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "ceo_responded_to_clarification",
    entityType: "ceo_response",
    entityId: response.id
  });

  revalidateCeoPaths();
  redirect("/dashboard/ceo?action=clarification-sent");
}

export async function resolveException(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = responseSchema.safeParse({
    businessId: formData.get("businessId"),
    linkedEntityId: formData.get("linkedEntityId"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    redirect("/dashboard/ceo?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/ceo?action=demo");
  }

  const { businessId, linkedEntityId, body } = parsed.data;
  const supabase = await createSupabaseRouteClient();

  const { data: exception } = await supabase
    .from("control_exceptions")
    .select("status")
    .eq("id", linkedEntityId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!exception || !canMoveExceptionStatus("ceo", exception.status as ExceptionStatus, "resolved")) {
    redirect("/dashboard/ceo?action=invalid-transition");
  }

  const { data: response, error: responseError } = await supabase
    .from("ceo_responses")
    .insert({
      business_id: businessId,
      responder_user_id: profile.id,
      response_type: "exception_resolution",
      body,
      linked_entity_type: "control_exception",
      linked_entity_id: linkedEntityId
    })
    .select("id")
    .single();

  if (responseError || !response) {
    redirect(`/dashboard/ceo?action=${encodeURIComponent(responseError?.message ?? "failed")}`);
  }

  const { error: exceptionError } = await supabase
    .from("control_exceptions")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", linkedEntityId)
    .eq("business_id", businessId);

  if (exceptionError) {
    redirect(`/dashboard/ceo?action=${encodeURIComponent(exceptionError.message)}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "ceo_resolved_exception",
    entityType: "control_exception",
    entityId: linkedEntityId,
    metadata: { response_id: response.id, previous_status: exception.status, next_status: "resolved" }
  });

  await runIcAutomationForBusiness({
    businessId,
    actorUserId: profile.id,
    trigger: "exception_resolved",
    entityType: "control_exception",
    entityId: linkedEntityId
  });

  revalidateCeoPaths();
  redirect("/dashboard/ceo?action=exception-resolved");
}

export async function shareIntegrityReport(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = shareSchema.safeParse({
    businessId: formData.get("businessId"),
    institutionName: formData.get("institutionName"),
    institutionEmail: formData.get("institutionEmail")
  });

  if (!parsed.success) {
    redirect("/dashboard/ceo?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/ceo?action=demo");
  }

  const { businessId, institutionName, institutionEmail } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  const { data: access, error } = await supabase
    .from("institution_access")
    .insert({
      business_id: businessId,
      institution_name: institutionName,
      institution_email: institutionEmail,
      status: "active",
      granted_by: profile.id
    })
    .select("id")
    .single();

  if (error || !access) {
    redirect(`/dashboard/ceo?action=${encodeURIComponent(error?.message ?? "failed")}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "ceo_shared_integrity_report",
    entityType: "institution_access",
    entityId: access.id,
    metadata: { institution_email: institutionEmail }
  });

  revalidateCeoPaths();
  redirect("/dashboard/ceo?action=report-shared");
}

export async function revokeIntegrityReportAccess(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = revokeSchema.safeParse({
    businessId: formData.get("businessId"),
    accessId: formData.get("accessId")
  });

  if (!parsed.success) {
    redirect("/dashboard/ceo?action=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/ceo?action=demo");
  }

  const { businessId, accessId } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase
    .from("institution_access")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", accessId)
    .eq("business_id", businessId);

  if (error) {
    redirect(`/dashboard/ceo?action=${encodeURIComponent(error.message)}`);
  }

  await writeAuditEvent({
    businessId,
    actorUserId: profile.id,
    eventType: "ceo_revoked_integrity_report_access",
    entityType: "institution_access",
    entityId: accessId
  });

  revalidateCeoPaths();
  redirect("/dashboard/ceo?action=report-revoked");
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

function revalidateCeoPaths() {
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/analyst");
  revalidatePath("/dashboard/super-admin");
  revalidatePath("/institution");
}
