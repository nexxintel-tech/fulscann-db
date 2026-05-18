import { describe, expect, it } from "vitest";
import { getOnboardingStatus } from "@/lib/ceo/onboarding";
import { assessmentResults, businesses, departments, kpiTargets } from "@/lib/data/sample-data";

describe("CEO onboarding", () => {
  it("calculates onboarding completion from profile, assessment, KPI, and department setup", () => {
    const status = getOnboardingStatus({
      business: businesses[0],
      departments,
      kpiTargets,
      assessmentResults
    });

    expect(status).toEqual({
      hasBusiness: true,
      hasAssessment: true,
      hasKpi: true,
      hasDepartment: true,
      completedSteps: 4,
      totalSteps: 4,
      completionPercentage: 100
    });
  });

  it("handles a CEO with no business profile yet", () => {
    const status = getOnboardingStatus({
      departments: [],
      kpiTargets: [],
      assessmentResults: []
    });

    expect(status.completedSteps).toBe(0);
    expect(status.completionPercentage).toBe(0);
  });
});
