import type { Department } from "@/lib/types";
import { buildCustomKpiKey } from "@/lib/kpis/business-kpis";
import { getDefaultKpiByKey } from "@/lib/kpis/default-kpis";

export type BusinessKpiFormInput = {
  businessId: string;
  department: Pick<Department, "id" | "departmentType">;
  selectedKpiKey: string;
  customName?: string | null;
  targetValue: number | null;
  unit: string;
  defaultFrequency: "monthly" | "quarterly" | "annual";
  createdBy: string;
};

export type BusinessKpiInsertPayload = {
  business_id: string;
  department_id: string;
  kpi_key: string;
  name: string;
  description: string;
  measurement_type: "currency" | "percentage" | "number";
  unit: string;
  target_value: number | null;
  default_frequency: "monthly" | "quarterly" | "annual";
  evidence_requirements: string[];
  ic_rule_links: string[];
  score_factor_links: string[];
  is_default: boolean;
  is_active: true;
  created_by: string;
};

export function buildBusinessKpiInsertPayload(input: BusinessKpiFormInput): BusinessKpiInsertPayload {
  const defaultKpi = input.selectedKpiKey === "custom" ? null : getDefaultKpiByKey(input.selectedKpiKey);

  if (input.selectedKpiKey !== "custom" && !defaultKpi) {
    throw new Error("invalid-kpi");
  }

  if (defaultKpi && defaultKpi.departmentSlug !== input.department.departmentType) {
    throw new Error("invalid-department");
  }

  if (defaultKpi) {
    return {
      business_id: input.businessId,
      department_id: input.department.id,
      kpi_key: defaultKpi.key,
      name: defaultKpi.name,
      description: defaultKpi.description,
      measurement_type: defaultKpi.measurementType,
      unit: input.unit || defaultKpi.unit,
      target_value: input.targetValue,
      default_frequency: input.defaultFrequency || defaultKpi.defaultFrequency,
      evidence_requirements: defaultKpi.evidenceRequirements,
      ic_rule_links: defaultKpi.icRuleLinks,
      score_factor_links: defaultKpi.scoreFactorLinks,
      is_default: true,
      is_active: true,
      created_by: input.createdBy
    };
  }

  const customName = input.customName?.trim() ?? "";

  if (customName.length === 0) {
    throw new Error("invalid");
  }

  return {
    business_id: input.businessId,
    department_id: input.department.id,
    kpi_key: buildCustomKpiKey(customName),
    name: customName,
    description: "Custom KPI defined by the CEO.",
    measurement_type: input.unit === "NGN" ? "currency" : "number",
    unit: input.unit,
    target_value: input.targetValue,
    default_frequency: input.defaultFrequency,
    evidence_requirements: [],
    ic_rule_links: [],
    score_factor_links: [],
    is_default: false,
    is_active: true,
    created_by: input.createdBy
  };
}
