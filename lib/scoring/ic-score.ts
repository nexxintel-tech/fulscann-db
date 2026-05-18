export type IcScoreInput = {
  evidenceCompleteness: number;
  crossDepartmentConsistency: number;
  approvalDiscipline: number;
  financialAlignment: number;
  reportingTimeliness: number;
  anomalyRisk: number;
  resolutionBehavior: number;
};

const IC_WEIGHTS: Record<keyof IcScoreInput, number> = {
  evidenceCompleteness: 0.15,
  crossDepartmentConsistency: 0.2,
  approvalDiscipline: 0.15,
  financialAlignment: 0.2,
  reportingTimeliness: 0.1,
  anomalyRisk: 0.15,
  resolutionBehavior: 0.05
};

export function calculateIcScore(input: IcScoreInput) {
  const score = Object.entries(IC_WEIGHTS).reduce((total, [key, weight]) => {
    return total + normalize(input[key as keyof IcScoreInput]) * weight;
  }, 0);

  return Math.round(score);
}

function normalize(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
