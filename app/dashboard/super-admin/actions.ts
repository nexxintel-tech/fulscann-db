"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { canMoveEscalationStatus } from "@/lib/ic-engine/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { ExceptionStatus } from "@/lib/types";

const assignmentSchema = z.object({
  analystId: z.string().min(1),
  businessId: z.string().min(1)
});

const escalationStatusSchema = z.object({
  escalationId: z.string().min(1),
  businessId: z.string().min(1),
  nextStatus: z.enum(["in_review", "resolved"])
});

export async function assignBusinessToAnalyst(formData: FormData) {
  const profile = await requireRole(["super_admin"]);
  const parsed = assignmentSchema.safeParse({
    analystId: formData.get("analystId"),
    businessId: formData.get("businessId")
  });

  if (!parsed.success) {
    redirect("/dashboard/super-admin?assignment=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/super-admin?assignment=demo");
  }

  const supabase = await createSupabaseRouteClient();
  const { analystId, businessId } = parsed.data;

  const { data: assignment, error: assignmentError } = await supabase
    .from("analyst_assignments")
    .insert({
      analyst_user_id: analystId,
      business_id: businessId,
      assigned_by: profile.id,
      status: "active"
    })
    .select("id")
    .single();

  if (assignmentError || !assignment) {
    redirect(`/dashboard/super-admin?assignment=${encodeURIComponent(assignmentError?.message ?? "failed")}`);
  }

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "analyst_assigned",
    entity_type: "analyst_assignment",
    entity_id: assignment.id,
    new_value: {
      analyst_user_id: analystId,
      business_id: businessId,
      assigned_by: profile.id
    },
    metadata: {
      source: "super_admin_dashboard"
    }
  });

  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/super-admin?assignment=success");
}

export async function moveEscalationLifecycle(formData: FormData) {
  const profile = await requireRole(["super_admin"]);
  const parsed = escalationStatusSchema.safeParse({
    escalationId: formData.get("escalationId"),
    businessId: formData.get("businessId"),
    nextStatus: formData.get("nextStatus")
  });

  if (!parsed.success) {
    redirect("/dashboard/super-admin?escalation=invalid");
  }

  if (!hasSupabaseConfig()) {
    redirect("/dashboard/super-admin?escalation=demo");
  }

  const { escalationId, businessId, nextStatus } = parsed.data;
  const supabase = await createSupabaseRouteClient();
  const { data: escalation } = await supabase
    .from("analyst_escalations")
    .select("status")
    .eq("id", escalationId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!escalation || !canMoveEscalationStatus("super_admin", escalation.status as ExceptionStatus, nextStatus)) {
    redirect("/dashboard/super-admin?escalation=invalid-transition");
  }

  const { error } = await supabase
    .from("analyst_escalations")
    .update({
      status: nextStatus,
      resolved_at: nextStatus === "resolved" ? new Date().toISOString() : null
    })
    .eq("id", escalationId)
    .eq("business_id", businessId);

  if (error) {
    redirect(`/dashboard/super-admin?escalation=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: nextStatus === "resolved" ? "super_admin_resolved_escalation" : "super_admin_started_escalation_review",
    entity_type: "analyst_escalation",
    entity_id: escalationId,
    metadata: {
      previous_status: escalation.status,
      next_status: nextStatus
    }
  });

  revalidatePath("/dashboard/super-admin");
  revalidatePath("/dashboard/analyst");
  redirect(`/dashboard/super-admin?escalation=${nextStatus === "resolved" ? "resolved" : "in-review"}`);
}
