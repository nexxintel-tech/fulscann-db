"use server";

import { runBusinessIcAutomation } from "@/lib/ic-engine/automation";
import { buildIcPersistencePlan } from "@/lib/ic-engine/persistence";
import { hasSupabaseServiceConfig } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ControlException, DepartmentReport, EvidenceFile } from "@/lib/types";

type IcWorkflowTrigger =
  | "department_report_submitted"
  | "evidence_attached"
  | "exception_resolved"
  | "manual_recheck";

export type IcWorkflowRunResult = {
  skipped: boolean;
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  newExceptionCount: number;
  suppressedExceptionCount: number;
};

export async function runIcAutomationForBusiness(input: {
  businessId: string;
  actorUserId: string;
  trigger: IcWorkflowTrigger;
  entityType: string;
  entityId: string;
}): Promise<IcWorkflowRunResult | null> {
  if (!hasSupabaseServiceConfig()) {
    return {
      skipped: true,
      previousScore: 0,
      currentScore: 0,
      scoreDelta: 0,
      newExceptionCount: 0,
      suppressedExceptionCount: 0
    };
  }

  const supabase = createSupabaseAdminClient();
  const [reportRows, exceptionResult, evidenceResult, businessResult] = await Promise.all([
    fetchDepartmentReportsForIc(input.businessId),
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

  if (exceptionResult.error || evidenceResult.error || businessResult.error) {
    return null;
  }

  const reports: DepartmentReport[] = reportRows.map((row) => {
    const kpiKey = "kpi_key" in row && typeof row.kpi_key === "string" ? row.kpi_key : null;

    return {
      id: row.id,
      businessId: row.business_id,
      department: row.department,
      kpiKey,
      status: row.status,
      value: Number(row.value),
      evidenceCount: row.evidence_count
    };
  });
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
  const previousScore = businessResult.data?.current_ic_score ?? 0;
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
        metadata: { ...candidate, trigger: input.trigger, source_entity_type: input.entityType, source_entity_id: input.entityId }
      });
    }
  }

  for (const suppressed of plan.suppressedExceptionCandidates) {
    await supabase.from("audit_events").insert({
      business_id: input.businessId,
      actor_user_id: input.actorUserId,
      event_type: "ic_engine_suppressed_exception_candidate",
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: {
        title: suppressed.candidate.title,
        risk_level: suppressed.candidate.riskLevel,
        lifecycle_state: suppressed.state,
        existing_exception_id: suppressed.existingExceptionId ?? null,
        trigger: input.trigger
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
      previous_ic_score: previousScore,
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
      metadata: {
        ...plan.auditMetadata,
        trigger: input.trigger,
        source_entity_type: input.entityType,
        source_entity_id: input.entityId,
        previous_score: previousScore,
        current_score: result.icScore,
        score_delta: result.icScore - previousScore
      }
    });
  }

  return {
    skipped: false,
    previousScore,
    currentScore: result.icScore,
    scoreDelta: result.icScore - previousScore,
    newExceptionCount: plan.exceptionCandidatesToCreate.length,
    suppressedExceptionCount: plan.suppressedExceptionCandidates.length
  };
}

async function fetchDepartmentReportsForIc(businessId: string) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("department_reports")
    .select("id, business_id, department, kpi_key, status, value, evidence_count")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (!result.error) {
    return result.data ?? [];
  }

  if (!isMissingKpiSchemaError(result.error)) {
    return [];
  }

  const fallback = await supabase
    .from("department_reports")
    .select("id, business_id, department, status, value, evidence_count")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  return fallback.data ?? [];
}

function isMissingKpiSchemaError(error: { message: string }) {
  const message = error.message.toLowerCase();
  return message.includes("department_reports.kpi_key") || message.includes("kpi_key") || message.includes("schema cache");
}
