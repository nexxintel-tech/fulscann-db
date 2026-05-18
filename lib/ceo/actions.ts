import type { AnalystNote, ControlException, InstitutionAccess } from "@/lib/types";

export function getOpenClarificationRequests(notes: AnalystNote[], businessId: string) {
  return notes.filter(
    (note) =>
      note.businessId === businessId &&
      note.noteType === "clarification_request" &&
      note.visibility === "business_visible"
  );
}

export function getOpenExceptions(exceptions: ControlException[], businessId: string) {
  return exceptions.filter((exception) => exception.businessId === businessId && exception.status !== "resolved");
}

export function getActiveInstitutionAccess(access: InstitutionAccess[], businessId: string) {
  return access.filter((item) => item.businessId === businessId && item.status === "active");
}

export function canShareIntegrityReport(integrityReportReady: boolean) {
  return integrityReportReady;
}
