import type { AssessmentResult, Business, Department, KpiTarget } from "@/lib/types";

export function getOnboardingStatus(input: {
  business?: Business;
  departments: Department[];
  kpiTargets: KpiTarget[];
  assessmentResults: AssessmentResult[];
}) {
  const hasBusiness = Boolean(input.business);
  const businessId = input.business?.id;
  const hasAssessment = Boolean(
    businessId && input.assessmentResults.some((assessment) => assessment.businessId === businessId)
  );
  const hasKpi = Boolean(businessId && input.kpiTargets.some((kpi) => kpi.businessId === businessId));
  const hasDepartment = Boolean(
    businessId && input.departments.some((department) => department.businessId === businessId)
  );

  const completedSteps = [hasBusiness, hasAssessment, hasKpi, hasDepartment].filter(Boolean).length;

  return {
    hasBusiness,
    hasAssessment,
    hasKpi,
    hasDepartment,
    completedSteps,
    totalSteps: 4,
    completionPercentage: Math.round((completedSteps / 4) * 100)
  };
}
