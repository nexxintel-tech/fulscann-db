import { getSupabaseBrowserConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  analystAssignments,
  analystEscalations,
  analystNotes,
  analysts,
  businesses,
  ceoResponses,
  controlExceptions,
  departments,
  departmentReports,
  kpiTargets,
  businessKpis,
  assessmentResults,
  businessUsers,
  staffInvitations,
  icScoreResults,
  evidenceFiles,
  institutionAccess,
  auditEvents
} from "@/lib/data/sample-data";
import {
  mapAnalyst,
  mapAnalystEscalation,
  mapAnalystNote,
  mapAssignment,
  mapBusiness,
  mapCeoResponse,
  mapControlException,
  mapDepartment,
  mapDepartmentReport,
  mapKpiTarget,
  mapBusinessKpi,
  mapAssessmentResult,
  mapBusinessUser,
  mapStaffInvitation,
  mapIcScoreResult,
  mapEvidenceFile,
  mapInstitutionAccess,
  mapAuditEvent
} from "@/lib/data/mappers";

export async function getPlatformSnapshot() {
  if (!hasSupabaseConfig()) {
    return {
      businesses,
      analysts,
      analystAssignments,
      controlExceptions,
      departmentReports,
      analystNotes,
      analystEscalations,
      ceoResponses,
      institutionAccess,
      departments,
      kpiTargets,
      businessKpis,
      assessmentResults,
      businessUsers,
      staffInvitations,
      icScoreResults,
      evidenceFiles,
      auditEvents,
      source: "sample" as const
    };
  }

  getSupabaseBrowserConfig();
  const supabase = await createSupabaseRouteClient();

  const [
    businessResult,
    analystResult,
    assignmentResult,
    exceptionResult,
    reportRows,
    noteResult,
    escalationResult,
    responseResult,
    accessResult,
    departmentResult,
    kpiResult,
    businessKpiRows,
    veriscoreResult,
    businessUserResult,
    invitationResult,
    icScoreResult,
    evidenceResult,
    auditEventResult
  ] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").eq("platform_role", "analyst").order("full_name"),
    supabase.from("analyst_assignments").select("id, analyst_user_id, business_id, status").eq("status", "active"),
    supabase.from("control_exceptions").select("id, business_id, title, risk_level, status, created_at"),
    fetchDepartmentReports(supabase),
    supabase
      .from("analyst_notes")
      .select("id, business_id, analyst_user_id, note_type, body, visibility, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("analyst_escalations")
      .select("id, business_id, analyst_user_id, escalated_to, risk_level, reason, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("ceo_responses")
      .select("id, business_id, response_type, body, linked_entity_type, linked_entity_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("institution_access")
      .select("id, business_id, institution_name, institution_email, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("id, business_id, name, department_type, created_at").order("created_at"),
    supabase.from("kpi_targets").select("id, business_id, name, target_value, unit, period, created_at").order("created_at", { ascending: false }),
    fetchBusinessKpis(supabase),
    supabase.from("veriscore_results").select("id, business_id, veriscore, version, created_at").order("created_at", { ascending: false }),
    supabase
      .from("business_users")
      .select("id, business_id, user_id, role, department_id, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("staff_invitations")
      .select("id, business_id, department_id, email, role, status, invitation_token, accepted_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("ic_scores").select("id, business_id, score, version, created_at").order("created_at", { ascending: false }),
    supabase
      .from("evidence_files")
      .select("id, business_id, report_id, uploaded_by, file_name, file_type, storage_path, file_size, evidence_level, verification_status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_events")
      .select("id, business_id, actor_user_id, event_type, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  assertNoSupabaseError(businessResult.error);
  assertNoSupabaseError(analystResult.error);
  assertNoSupabaseError(assignmentResult.error);
  assertNoSupabaseError(exceptionResult.error);
  assertNoSupabaseError(noteResult.error);
  assertNoSupabaseError(escalationResult.error);
  assertNoSupabaseError(responseResult.error);
  assertNoSupabaseError(accessResult.error);
  assertNoSupabaseError(departmentResult.error);
  assertNoSupabaseError(kpiResult.error);
  assertNoSupabaseError(veriscoreResult.error);
  assertNoSupabaseError(businessUserResult.error);
  assertNoSupabaseError(invitationResult.error);
  assertNoSupabaseError(icScoreResult.error);
  assertNoSupabaseError(evidenceResult.error);
  assertNoSupabaseError(auditEventResult.error);

  return {
    businesses: (businessResult.data ?? []).map(mapBusiness),
    analysts: (analystResult.data ?? []).map(mapAnalyst),
    analystAssignments: (assignmentResult.data ?? []).map(mapAssignment),
    controlExceptions: (exceptionResult.data ?? []).map(mapControlException),
    departmentReports: reportRows.map(mapDepartmentReport),
    analystNotes: (noteResult.data ?? []).map(mapAnalystNote),
    analystEscalations: (escalationResult.data ?? []).map(mapAnalystEscalation),
    ceoResponses: (responseResult.data ?? []).map(mapCeoResponse),
    institutionAccess: (accessResult.data ?? []).map(mapInstitutionAccess),
    departments: (departmentResult.data ?? []).map(mapDepartment),
    kpiTargets: (kpiResult.data ?? []).map(mapKpiTarget),
    businessKpis: businessKpiRows.map(mapBusinessKpi),
    assessmentResults: (veriscoreResult.data ?? []).map(mapAssessmentResult),
    businessUsers: (businessUserResult.data ?? []).map(mapBusinessUser),
    staffInvitations: (invitationResult.data ?? []).map(mapStaffInvitation),
    icScoreResults: (icScoreResult.data ?? []).map(mapIcScoreResult),
    evidenceFiles: await withSignedEvidenceUrls((evidenceResult.data ?? []).map(mapEvidenceFile)),
    auditEvents: (auditEventResult.data ?? []).map(mapAuditEvent),
    source: "supabase" as const
  };
}

export async function getInstitutionSnapshot() {
  if (!hasSupabaseConfig()) {
    return {
      businesses: businesses.filter((business) => business.integrityReportReady),
      controlExceptions: controlExceptions.filter((exception) =>
        businesses.some((business) => business.id === exception.businessId && business.integrityReportReady)
      ),
      institutionAccess,
      businessKpis,
      source: "sample" as const
    };
  }

  getSupabaseBrowserConfig();
  const supabase = await createSupabaseRouteClient();

  const [businessResult, exceptionResult, accessResult, businessKpiRows] = await Promise.all([
    supabase
      .from("businesses")
      .select("*")
      .eq("integrity_report_ready", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("control_exceptions")
      .select("id, business_id, title, risk_level, status, created_at")
      .neq("status", "resolved"),
    supabase
      .from("institution_access")
      .select("id, business_id, institution_name, institution_email, status, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    fetchBusinessKpis(supabase, { activeOnly: true })
  ]);

  assertNoSupabaseError(businessResult.error);
  assertNoSupabaseError(exceptionResult.error);
  assertNoSupabaseError(accessResult.error);

  return {
    businesses: (businessResult.data ?? []).map(mapBusiness),
    controlExceptions: (exceptionResult.data ?? []).map(mapControlException),
    institutionAccess: (accessResult.data ?? []).map(mapInstitutionAccess),
    businessKpis: businessKpiRows.map(mapBusinessKpi),
    source: "supabase" as const
  };
}

type SupabaseRouteClient = Awaited<ReturnType<typeof createSupabaseRouteClient>>;

async function fetchDepartmentReports(supabase: SupabaseRouteClient) {
  const result = await supabase
    .from("department_reports")
    .select("id, business_id, department, kpi_key, status, value, evidence_count");

  if (!result.error) {
    return result.data ?? [];
  }

  if (!isRecoverableKpiSchemaDrift(result.error)) {
    assertNoSupabaseError(result.error);
  }

  const fallback = await supabase
    .from("department_reports")
    .select("id, business_id, department, status, value, evidence_count");

  assertNoSupabaseError(fallback.error);
  return fallback.data ?? [];
}

async function fetchBusinessKpis(supabase: SupabaseRouteClient, options?: { activeOnly?: boolean }) {
  let query = supabase
    .from("business_kpis")
    .select("id, business_id, department_id, kpi_key, name, description, measurement_type, unit, target_value, default_frequency, evidence_requirements, ic_rule_links, score_factor_links, is_default, is_active, created_by, created_at, updated_at");

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const result = await query.order("created_at", { ascending: false });

  if (!result.error) {
    return result.data ?? [];
  }

  if (isRecoverableKpiSchemaDrift(result.error)) {
    return [];
  }

  assertNoSupabaseError(result.error);
  return [];
}

async function withSignedEvidenceUrls(evidenceFiles: ReturnType<typeof mapEvidenceFile>[]) {
  const supabase = await createSupabaseRouteClient();

  return Promise.all(
    evidenceFiles.map(async (file) => {
      if (!file.storagePath) {
        return file;
      }

      const { data } = await supabase.storage
        .from("evidence-files")
        .createSignedUrl(file.storagePath, 60 * 10);

      return {
        ...file,
        signedUrl: data?.signedUrl ?? null
      };
    })
  );
}

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export function isRecoverableKpiSchemaDrift(error: { message: string }) {
  const message = error.message.toLowerCase();
  return (
    message.includes("department_reports.kpi_key") ||
    message.includes("kpi_key") ||
    message.includes("business_kpis") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}
