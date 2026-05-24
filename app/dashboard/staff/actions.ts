"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import type { Department } from "@/lib/types";
import { buildEvidenceStoragePath, EVIDENCE_BUCKET, validateEvidenceUpload } from "@/lib/evidence/storage";
import { runIcAutomationForBusiness } from "@/lib/ic-engine/workflow";
import { getDefaultKpisForDepartment } from "@/lib/kpis/default-kpis";
import { isDepartmentHeadRole } from "@/lib/staff/roles";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  businessId: z.string().min(1),
  department: z.enum(["sales", "finance", "procurement", "operations", "hr"]),
  kpiKey: z.string().max(120).optional(),
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

const departmentHeadReportActionSchema = z.object({
  businessId: z.string().min(1),
  reportId: z.string().min(1),
  body: z.string().min(3).max(1000)
});

const departmentHeadReadySchema = z.object({
  businessId: z.string().min(1),
  reportId: z.string().min(1)
});

const departmentHeadEscalationSchema = z.object({
  businessId: z.string().min(1),
  exceptionId: z.string().min(1),
  body: z.string().min(3).max(1000)
});

export async function submitDepartmentReport(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, department, kpiKey, value, evidenceCount, note } = parsed.data;
  const departmentAccess = await getDepartmentAccessForUser(supabase, profile.id, businessId);

  if (!departmentAccess || departmentAccess.department.departmentType !== department) {
    redirect("/dashboard/staff?action=unauthorized-department");
  }

  if (kpiKey && !(await isValidKpiKeyForDepartment(supabase, businessId, departmentAccess.department, kpiKey))) {
    redirect("/dashboard/staff?action=invalid-kpi");
  }

  const reportPayload = {
    business_id: businessId,
    department,
    status: "submitted",
    value,
    evidence_count: evidenceCount,
    submitted_by: profile.id,
    ...(kpiKey ? { kpi_key: kpiKey } : {})
  };
  const { data: report, error } = await supabase
    .from("department_reports")
    .insert(reportPayload)
    .select("id")
    .single();

  if (error || !report) redirect(`/dashboard/staff?action=${encodeURIComponent(error?.message ?? "failed")}`);

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "staff_submitted_department_report",
    entity_type: "department_report",
    entity_id: report.id,
    metadata: { department, kpi_key: kpiKey || null, evidence_count: evidenceCount, note: note ?? null }
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
  const departmentAccess = await getDepartmentAccessForUser(supabase, profile.id, businessId);

  if (!departmentAccess) {
    redirect("/dashboard/staff?action=unauthorized-department");
  }

  const linkedReport = await getReportInAssignedDepartment(supabase, businessId, reportId, departmentAccess.department.departmentType);

  if (!linkedReport) {
    redirect("/dashboard/staff?action=unauthorized-department");
  }

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

export async function requestDepartmentCorrection(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = departmentHeadReportActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, reportId, body } = parsed.data;
  const departmentAccess = await getDepartmentAccessForUser(supabase, profile.id, businessId, { requireDepartmentHead: true });

  if (!departmentAccess) redirect("/dashboard/staff?action=department-head-required");

  const report = await getReportInAssignedDepartment(supabase, businessId, reportId, departmentAccess.department.departmentType);

  if (!report) redirect("/dashboard/staff?action=unauthorized-department");

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "department_head_requested_correction",
    entity_type: "department_report",
    entity_id: reportId,
    metadata: { department: report.department, body }
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  redirect("/dashboard/staff?action=correction-requested");
}

export async function markDepartmentResponseReady(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = departmentHeadReadySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, reportId } = parsed.data;
  const departmentAccess = await getDepartmentAccessForUser(supabase, profile.id, businessId, { requireDepartmentHead: true });

  if (!departmentAccess) redirect("/dashboard/staff?action=department-head-required");

  const report = await getReportInAssignedDepartment(supabase, businessId, reportId, departmentAccess.department.departmentType);

  if (!report) redirect("/dashboard/staff?action=unauthorized-department");

  const { error } = await supabase
    .from("department_reports")
    .update({ status: "review_ready", updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("business_id", businessId)
    .eq("department", departmentAccess.department.departmentType);

  if (error) redirect(`/dashboard/staff?action=${encodeURIComponent(error.message)}`);

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "department_head_marked_response_ready",
    entity_type: "department_report",
    entity_id: reportId,
    metadata: { department: report.department }
  });

  await runIcAutomationForBusiness({
    businessId,
    actorUserId: profile.id,
    trigger: "manual_recheck",
    entityType: "department_report",
    entityId: reportId
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  revalidatePath("/dashboard/analyst");
  redirect("/dashboard/staff?action=response-ready");
}

export async function escalateDepartmentIssueToCeo(formData: FormData) {
  const profile = await requireRole(["business_user"]);
  const parsed = departmentHeadEscalationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) redirect("/dashboard/staff?action=invalid");
  if (!hasSupabaseConfig()) redirect("/dashboard/staff?action=demo");

  const supabase = await createSupabaseRouteClient();
  const { businessId, exceptionId, body } = parsed.data;
  const departmentAccess = await getDepartmentAccessForUser(supabase, profile.id, businessId, { requireDepartmentHead: true });

  if (!departmentAccess) redirect("/dashboard/staff?action=department-head-required");

  const { data: exception } = await supabase
    .from("control_exceptions")
    .select("id, title, status")
    .eq("id", exceptionId)
    .eq("business_id", businessId)
    .single();

  if (!exception || !isExceptionLinkedToDepartment(exception.title, departmentAccess.department.departmentType)) {
    redirect("/dashboard/staff?action=unauthorized-department");
  }

  await supabase.from("audit_events").insert({
    business_id: businessId,
    actor_user_id: profile.id,
    event_type: "department_head_escalated_issue_to_ceo",
    entity_type: "control_exception",
    entity_id: exceptionId,
    metadata: { department: departmentAccess.department.departmentType, body, status: exception.status }
  });

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/ceo");
  redirect("/dashboard/staff?action=issue-escalated");
}

type SupabaseQueryClient = Awaited<ReturnType<typeof createSupabaseRouteClient>>;

async function getDepartmentAccessForUser(
  supabase: SupabaseQueryClient,
  userId: string,
  businessId: string,
  options?: { requireDepartmentHead?: boolean }
) {
  const { data: membership } = await supabase
    .from("business_users")
    .select("role, department_id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!membership?.department_id || membership.role === "ceo") {
    return null;
  }

  if (options?.requireDepartmentHead && !isDepartmentHeadRole(membership.role)) {
    return null;
  }

  const { data: department } = await supabase
    .from("departments")
    .select("id, business_id, name, department_type, created_at")
    .eq("id", membership.department_id)
    .eq("business_id", businessId)
    .single();

  if (!department) {
    return null;
  }

  return {
    role: membership.role,
    department: {
      id: department.id,
      businessId: department.business_id,
      name: department.name,
      departmentType: department.department_type,
      createdAt: department.created_at
    } as Department
  };
}

async function getReportInAssignedDepartment(
  supabase: SupabaseQueryClient,
  businessId: string,
  reportId: string,
  departmentType: Department["departmentType"]
) {
  const { data: report } = await supabase
    .from("department_reports")
    .select("id, department")
    .eq("id", reportId)
    .eq("business_id", businessId)
    .eq("department", departmentType)
    .single();

  return report;
}

function isExceptionLinkedToDepartment(title: string, departmentType: Department["departmentType"]) {
  return title.toLowerCase().includes(departmentType);
}

async function isValidKpiKeyForDepartment(
  supabase: SupabaseQueryClient,
  businessId: string,
  department: Department,
  kpiKey: string
) {
  const defaultMatch = getDefaultKpisForDepartment(department.departmentType).some((kpi) => kpi.key === kpiKey);

  if (defaultMatch) {
    return true;
  }

  const { data, error } = await supabase
    .from("business_kpis")
    .select("id")
    .eq("business_id", businessId)
    .eq("department_id", department.id)
    .eq("kpi_key", kpiKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}
