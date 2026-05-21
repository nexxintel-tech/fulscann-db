"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { buildEvidenceStoragePath, EVIDENCE_BUCKET, validateEvidenceUpload } from "@/lib/evidence/storage";
import { runIcAutomationForBusiness } from "@/lib/ic-engine/workflow";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  businessId: z.string().min(1),
  department: z.enum(["sales", "finance", "procurement", "operations", "hr"]),
  value: z.coerce.number().nonnegative(),
  evidenceCount: z.coerce.number().int().min(0),
  note: z.string().max(1000).optional()
});

const evidenceSchema = z.object({
  businessId: z.string().min(1),
  reportId: z.string().min(1),
  fileType: z.string().min(2).max(80),
  evidenceLevel: z.coerce.number().int().min(0).max(3)
});

export async function submitDepartmentReport(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, department, value, evidenceCount, note } = parsed.data;
  const { data: report, error } = await supabase
    .from("department_reports")
    .insert({
      business_id: businessId,
      department,
      status: "submitted",
      value,
      evidence_count: evidenceCount,
      submitted_by: profile.id
    })
    .select("id")
    .single();

  if (error || !report) redirect(`/dashboard/staff?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "staff_submitted_department_report",
    entity_type: "department_report",
    entity_id: report.id,
    metadata: { department, evidence_count: evidenceCount, note: note ?? null }
  });

  await supabase.from("businesses").update({ last_activity_at: new Date().toISOString() }).eq("id", businessId);
  await runIcAutomationForBusiness({
    businessId,
    actorUserId: profile.id,
    trigger: "department_report_submitted",
    entityType: "department_report",
    entityId: report.id
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/staff?action=report-submitted");
}

export async function attachEvidenceToReport(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = evidenceSchema.safeParse(Object.fromEntries(formData));
  const evidenceFile = formData.get("evidenceFile");
  const file = evidenceFile instanceof File ? evidenceFile : null;

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");
  const uploadError = validateEvidenceUpload(file);
  if (uploadError || !file) redirect(`/dashboard/staff?action=${encodeURIComponent(uploadError ?? "invalid-file")}`);

  const supabase = await createSupabaseRouteClient();
  const { businessId, reportId, fileType, evidenceLevel } = parsed.data;
  const storagePath = buildEvidenceStoragePath({
    businessId,
    reportId,
    fileName: file.name,
    uniqueId: crypto.randomUUID()
  });
  const { error: uploadErrorResult } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadErrorResult) redirect(`/dashboard/staff?action=${encodeURIComponent(uploadErrorResult.message)}`);

  const { data: evidence, error } = await supabase
    .from("evidence_files")
    .insert({
      business_id: businessId,
      report_id: reportId,
      uploaded_by: profile.id,
      file_name: file.name,
      file_type: fileType,
      storage_path: storagePath,
      file_size: file.size,
      evidence_level: evidenceLevel,
      verification_status: "pending"
    })
    .select("id")
    .single();

  if (error || !evidence) redirect(`/dashboard/staff?action=${encodeURIComponent(error?.message ?? "failed")}`);

  const { count } = await supabase
    .from("evidence_files")
    .select("id", { count: "exact", head: true })
    .eq("report_id", reportId);
  const { data: linkedReport } = await supabase
    .from("department_reports")
    .select("department")
    .eq("id", reportId)
    .eq("business_id", businessId)
    .single();

  await supabase
    .from("department_reports")
    .update({ evidence_count: count ?? 1 })
    .eq("id", reportId)
    .eq("business_id", businessId);

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "staff_attached_evidence",
    entity_type: "evidence_file",
    entity_id: evidence.id,
    metadata: { report_id: reportId, evidence_level: evidenceLevel, file_type: fileType, storage_path: storagePath }
  });

  if (linkedReport?.department) {
    await runIcAutomationForBusiness({
      businessId,
      actorUserId: profile.id,
      trigger: "evidence_attached",
      entityType: "evidence_file",
      entityId: evidence.id
    });
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/staff?action=evidence-attached");
}
