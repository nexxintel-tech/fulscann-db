"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { buildEvidenceStoragePath, EVIDENCE_BUCKET, validateEvidenceUpload } from "@/lib/evidence/storage";
import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { buildIcPersistencePlan } from "@/lib/ic-engine/persistence";
import type { ControlException, DepartmentReport, EvidenceFile } from "@/lib/types";
import { hasSupabaseConfig, hasSupabaseServiceConfig } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseRouteClient } from "@/lib/supabase/server";

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
  await runIcAutomationAfterReport({
    businessId,
    actorUserId: profile.id,
    department
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
    await runIcAutomationAfterReport({
      businessId,
      actorUserId: profile.id,
      department: linkedReport.department
    });
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/staff?action=evidence-attached");
}

async function runIcAutomationAfterReport(input: {
  businessId: string;
  actorUserId: string;
  department: "sales" | "finance" | "procurement" | "operations" | "hr";
}) {
  if (!hasSupabaseServiceConfig()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const [reportResult, exceptionResult, evidenceResult, businessResult] = await Promise.all([
    supabase
      .from("department_reports")
      .select("id, business_id, department, status, value, evidence_count")
      .eq("business_id", input.businessId)
      .order("created_at", { ascending: true }),
    supabase
      .from("control_exceptions")
      .select("id, business_id, title, risk_level, status, created_at")
      .eq("business_id", input.businessId),
    supabase
      .from("evidence_files")
      .select("id, business_id, report_id, uploaded_by, file_name, file_type, storage_path, file_size, evidence_level, verification_status, created_at")
      .eq("business_id", input.businessId),
    supabase
      .from("businesses")
      .select("evidence_completion, current_ic_score")
      .eq("id", input.businessId)
      .single()
  ]);

  if (reportResult.error || exceptionResult.error || evidenceResult.error || businessResult.error) {
    return;
  }

  const reports: DepartmentReport[] = (reportResult.data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    department: row.department,
    status: row.status,
    value: Number(row.value),
    evidenceCount: row.evidence_count
  }));
  const exceptions: ControlException[] = (exceptionResult.data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    riskLevel: row.risk_level,
    status: row.status,
    daysOpen: 0
  }));
  const evidenceFiles: EvidenceFile[] = (evidenceResult.data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    reportId: row.report_id,
    uploadedBy: row.uploaded_by,
    fileName: row.file_name,
    fileType: row.file_type,
    storagePath: row.storage_path,
    fileSize: Number(row.file_size),
    evidenceLevel: row.evidence_level,
    verificationStatus: row.verification_status,
    signedUrl: null,
    createdAt: row.created_at
  }));
  const result = runBusinessIcAutomation({
    reports,
    existingExceptions: exceptions,
    evidenceCompletion: businessResult.data?.evidence_completion ?? 0,
    evidenceFiles
  });
  const plan = buildIcPersistencePlan(result);

  for (const candidate of plan.exceptionCandidatesToCreate) {
    const { data: createdException } = await supabase
      .from("control_exceptions")
      .insert({
        business_id: input.businessId,
        title: candidate.title,
        description: candidate.description,
        risk_level: candidate.riskLevel,
        status: "open"
      })
      .select("id")
      .single();

    if (createdException) {
      await supabase.from("audit_events").insert({
        business_id: input.businessId,
        actor_user_id: input.actorUserId,
        event_type: "ic_engine_created_exception",
        entity_type: "control_exception",
        entity_id: createdException.id,
        metadata: candidate
      });
    }
  }

  for (const suppressed of plan.suppressedExceptionCandidates) {
    await supabase.from("audit_events").insert({
      business_id: input.businessId,
      actor_user_id: input.actorUserId,
      event_type: "ic_engine_suppressed_exception_candidate",
      entity_type: "business",
      entity_id: input.businessId,
      metadata: {
        title: suppressed.candidate.title,
        risk_level: suppressed.candidate.riskLevel,
        lifecycle_state: suppressed.state,
        existing_exception_id: suppressed.existingExceptionId ?? null
      }
    });
  }

  const { data: score } = await supabase
    .from("ic_scores")
    .insert({
      business_id: input.businessId,
      score: result.icScore,
      version: "v1.0",
      created_by: input.actorUserId
    })
    .select("id")
    .single();

  await supabase
    .from("businesses")
    .update({
      previous_ic_score: businessResult.data?.current_ic_score ?? result.icScore,
      current_ic_score: result.icScore,
      evidence_completion: result.scoreFactors.evidenceCompleteness,
      last_activity_at: new Date().toISOString()
    })
    .eq("id", input.businessId);

  if (score) {
    await supabase.from("audit_events").insert({
      business_id: input.businessId,
      actor_user_id: input.actorUserId,
      event_type: "ic_score_recalculated",
      entity_type: "ic_score",
      entity_id: score.id,
      metadata: plan.auditMetadata
    });
  }
}
