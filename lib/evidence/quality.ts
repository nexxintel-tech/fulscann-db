import type { EvidenceFile } from "@/lib/types";

export function getEvidenceForReport(evidenceFiles: EvidenceFile[], reportId: string) {
  return evidenceFiles.filter((file) => file.reportId === reportId);
}

export function getEvidenceForBusiness(evidenceFiles: EvidenceFile[], businessId: string) {
  return evidenceFiles.filter((file) => file.businessId === businessId);
}

export function getAverageEvidenceLevel(evidenceFiles: EvidenceFile[]) {
  if (evidenceFiles.length === 0) {
    return 0;
  }

  const total = evidenceFiles.reduce((sum, file) => sum + file.evidenceLevel, 0);
  return Math.round((total / evidenceFiles.length) * 10) / 10;
}

export function getEvidenceCompletionFromLevels(evidenceFiles: EvidenceFile[]) {
  if (evidenceFiles.length === 0) {
    return 0;
  }

  const levelScore = getAverageEvidenceLevel(evidenceFiles) / 3;
  return Math.round(levelScore * 100);
}

export function hasEvidenceGap(evidenceFiles: EvidenceFile[], minimumAverageLevel = 1.5) {
  return getAverageEvidenceLevel(evidenceFiles) < minimumAverageLevel;
}
