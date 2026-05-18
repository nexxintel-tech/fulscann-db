export type AssessmentResponse = {
  category: "structure" | "finance" | "controls" | "evidence" | "governance";
  score: number;
};

const CATEGORY_WEIGHTS: Record<AssessmentResponse["category"], number> = {
  structure: 0.2,
  finance: 0.2,
  controls: 0.25,
  evidence: 0.2,
  governance: 0.15
};

export function calculateVeriScore(responses: AssessmentResponse[]) {
  if (responses.length === 0) {
    return 0;
  }

  const grouped = responses.reduce<Record<string, number[]>>((result, response) => {
    result[response.category] = result[response.category] ?? [];
    result[response.category].push(clampScore(response.score));
    return result;
  }, {});

  const weightedScore = Object.entries(CATEGORY_WEIGHTS).reduce((total, [category, weight]) => {
    const scores = grouped[category] ?? [0];
    const categoryAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return total + categoryAverage * weight;
  }, 0);

  return Math.round(weightedScore);
}

function clampScore(score: number) {
  return Math.min(Math.max(score, 0), 100);
}
