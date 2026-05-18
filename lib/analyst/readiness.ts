import { getEvidenceForBusiness, hasEvidenceGap } from "@/lib/evidence/quality";
import type { Business, BusinessReadiness, ControlException, EvidenceFile } from "@/lib/types";

const HIGH_RISK_LEVELS = new Set(["Orange", "Red"]);
const INACTIVE_DAYS_THRESHOLD = 7;
const EVIDENCE_COMPLETION_THRESHOLD = 70;

export function getBusinessReadiness(
  businesses: Business[],
  exceptions: ControlException[],
  evidenceFiles: EvidenceFile[] = []
): BusinessReadiness[] {
  return businesses.map((business) => {
    const openHighRiskExceptions = exceptions.filter(
      (exception) =>
        exception.businessId === business.id &&
        exception.status !== "resolved" &&
        HIGH_RISK_LEVELS.has(exception.riskLevel)
    ).length;

    const businessEvidence = getEvidenceForBusiness(evidenceFiles, business.id);
    const missingEvidence =
      business.evidenceCompletion < EVIDENCE_COMPLETION_THRESHOLD ||
      (businessEvidence.length > 0 && hasEvidenceGap(businessEvidence));
    const decliningIcScore = business.currentIcScore < business.previousIcScore;
    const decliningVeriScore = business.currentVeriScore < business.previousVeriScore;
    const inactive = business.lastActivityDaysAgo > INACTIVE_DAYS_THRESHOLD;

    return {
      business,
      openHighRiskExceptions,
      missingEvidence,
      decliningIcScore,
      decliningVeriScore,
      inactive,
      needsIntervention:
        openHighRiskExceptions > 0 ||
        missingEvidence ||
        decliningIcScore ||
        decliningVeriScore ||
        inactive ||
        !business.assessmentComplete ||
        !business.kpiSetupComplete
    };
  });
}
