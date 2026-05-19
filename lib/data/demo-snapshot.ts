import {
  analystAssignments,
  analystNotes,
  analysts,
  assessmentResults,
  businesses,
  businessUsers,
  ceoResponses,
  controlExceptions,
  departments,
  departmentReports,
  evidenceFiles,
  icScoreResults,
  institutionAccess,
  kpiTargets,
  staffInvitations
} from "@/lib/data/sample-data";

export function getDemoSnapshot() {
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
    source: "demo" as const
  };
}
