import { getSupabaseBrowserConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  analystAssignments,
  analystNotes,
  analysts,
  businesses,
  ceoResponses,
  controlExceptions,
  departments,
  departmentReports,
  kpiTargets,
  assessmentResults,
  businessUsers,
  staffInvitations,
  icScoreResults,
  evidenceFiles,
  institutionAccess
} from "@/lib/data/sample-data";
import {
  mapAnalyst,
  mapAnalystNote,
  mapAssignment,
  mapBusiness,
  mapCeoResponse,
  mapControlException,
  mapDepartment,
  mapDepartmentReport,
  mapKpiTarget,
  mapAssessmentResult,
  mapBusinessUser,
  mapStaffInvitation,
  mapIcScoreResult,
  mapEvidenceFile,
  mapInstitutionAccess
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
      ceoResponses,
      institutionAccess,
      departments,
      kpiTargets,
      assessmentResults,
      businessUsers,
      staffInvitations,
      icScoreResults,
      evidenceFiles,
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
    reportResult,
    noteResult,
    responseResult,
    accessResult,
    departmentResult,
    kpiResult,
    veriscoreResult,
    businessUserResult,
    invitationResult,
    icScoreResult,
    evidenceResult
  ] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").eq("platform_role", "analyst").order("full_name"),
    supabase.from("analyst_assignments").select("id, analyst_user_id, business_id, status").eq("status", "active"),
    supabase.from("control_exceptions").select("id, business_id, title, risk_level, status, created_at"),
    supabase.from("department_reports").select("id, business_id, department, status, value, evidence_count"),
    supabase
      .from("analyst_notes")
      .select("id, business_id, analyst_user_id, note_type, body, visibility, created_at")
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
      .order("created_at", { ascending: false })
  ]);

  assertNoSupabaseError(businessResult.error);
  assertNoSupabaseError(analystResult.error);
  assertNoSupabaseError(assignmentResult.error);
  assertNoSupabaseError(exceptionResult.error);
  assertNoSupabaseError(reportResult.error);
  assertNoSupabaseError(noteResult.error);
  assertNoSupabaseError(responseResult.error);
  assertNoSupabaseError(accessResult.error);
  assertNoSupabaseError(departmentResult.error);
  assertNoSupabaseError(kpiResult.error);
  assertNoSupabaseError(veriscoreResult.error);
  assertNoSupabaseError(businessUserResult.error);
  assertNoSupabaseError(invitationResult.error);
  assertNoSupabaseError(icScoreResult.error);
  assertNoSupabaseError(evidenceResult.error);

  return {
    businesses: (businessResult.data ?? []).map(mapBusiness),
    analysts: (analystResult.data ?? []).map(mapAnalyst),
    analystAssignments: (assignmentResult.data ?? []).map(mapAssignment),
    controlExceptions: (exceptionResult.data ?? []).map(mapControlException),
    departmentReports: (reportResult.data ?? []).map(mapDepartmentReport),
    analystNotes: (noteResult.data ?? []).map(mapAnalystNote),
    ceoResponses: (responseResult.data ?? []).map(mapCeoResponse),
    institutionAccess: (accessResult.data ?? []).map(mapInstitutionAccess),
    departments: (departmentResult.data ?? []).map(mapDepartment),
    kpiTargets: (kpiResult.data ?? []).map(mapKpiTarget),
    assessmentResults: (veriscoreResult.data ?? []).map(mapAssessmentResult),
    businessUsers: (businessUserResult.data ?? []).map(mapBusinessUser),
    staffInvitations: (invitationResult.data ?? []).map(mapStaffInvitation),
    icScoreResults: (icScoreResult.data ?? []).map(mapIcScoreResult),
    evidenceFiles: await withSignedEvidenceUrls((evidenceResult.data ?? []).map(mapEvidenceFile)),
    source: "supabase" as const
  };
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
