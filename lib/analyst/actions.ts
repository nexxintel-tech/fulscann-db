import type { AnalystAssignment } from "@/lib/types";

export const ANALYST_NOTE_TYPES = ["internal_note", "clarification_request", "review_ready"] as const;
export const ESCALATION_RISK_LEVELS = ["Orange", "Red"] as const;

export type AnalystNoteType = (typeof ANALYST_NOTE_TYPES)[number];
export type EscalationRiskLevel = (typeof ESCALATION_RISK_LEVELS)[number];

export function isAnalystAssignedToBusiness(
  analystId: string,
  businessId: string,
  assignments: AnalystAssignment[]
) {
  return assignments.some(
    (assignment) =>
      assignment.analystId === analystId &&
      assignment.businessId === businessId &&
      assignment.status === "active"
  );
}

export function canEscalateRiskLevel(riskLevel: string): riskLevel is EscalationRiskLevel {
  return ESCALATION_RISK_LEVELS.includes(riskLevel as EscalationRiskLevel);
}
